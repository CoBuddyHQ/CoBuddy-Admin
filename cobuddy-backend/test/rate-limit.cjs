/* Exercises the production Redis adapter across two local HTTP instances.
 * Only UUID-namespaced, expiring test keys are written or removed.
 */
require('dotenv').config();
require('reflect-metadata');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { once } = require('node:events');
const { setTimeout: delay } = require('node:timers/promises');
const { Controller, Get } = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');
const { APP_GUARD } = require('@nestjs/core');
const { Test } = require('@nestjs/testing');
const { ThrottlerModule, ThrottlerGuard, Throttle } = require('@nestjs/throttler');
const { createThrottleOptions } = require('../dist/src/config/throttling');
const { configureHttpServer } = require('../dist/src/config/http.config');
const { AllExceptionsFilter } = require('../dist/src/common/filters/all-exceptions.filter');

async function main() {
  const environment = process.env.NODE_ENV;
  assert(!['production', 'staging'].includes(environment), 'Use a development/test Redis');
  const url = new URL(process.env.REDIS_URL);
  assert(
    ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
      process.env.SMOKE_ALLOW_NONLOCAL_REDIS === '1',
    'Non-local Redis requires SMOKE_ALLOW_NONLOCAL_REDIS=1 for a dedicated test instance',
  );

  const runId = 'rate-limit-test-' + randomUUID();
  const keys = new Set();
  const apps = [];
  const stores = [];
  let passed = 0;
  const check = (name, assertion) => {
    assert(assertion, name);
    passed += 1;
    console.log('PASS ' + name);
  };
  const trackKey = (key, name = 'default') => {
    keys.add(`{${key}:${name}}:hits`);
    keys.add(`{${key}:${name}}:blocked`);
    return key;
  };

  class LimitFixtureController {
    normal() {
      return { ok: true };
    }
    login() {
      return { ok: true };
    }
    concurrent() {
      return { ok: true };
    }
  }
  Controller('rate-test')(LimitFixtureController);
  for (const route of ['normal', 'login', 'concurrent']) {
    const descriptor = Object.getOwnPropertyDescriptor(LimitFixtureController.prototype, route);
    Get(route)(LimitFixtureController.prototype, route, descriptor);
    if (route !== 'normal') {
      Throttle({ default: { limit: route === 'login' ? 3 : 5, ttl: 60_000 } })(
        LimitFixtureController.prototype,
        route,
        descriptor,
      );
    }
  }

  try {
    process.env.NODE_ENV = 'production';
    for (let index = 0; index < 2; index++) {
      const options = createThrottleOptions(
        new ConfigService({ NODE_ENV: 'production', REDIS_URL: process.env.REDIS_URL }),
      );
      stores.push(options.storage);
      options.generateKey = (context, tracker, name) =>
        trackKey(`${runId}:${context.getHandler().name}:${tracker}`, name);
      const moduleRef = await Test.createTestingModule({
        imports: [ThrottlerModule.forRoot(options)],
        controllers: [LimitFixtureController],
        providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
      }).compile();
      const app = moduleRef.createNestApplication({ bodyParser: false, logger: false });
      apps.push(app);
      configureHttpServer(app.getHttpAdapter().getInstance(), []);
      app.useGlobalFilters(new AllExceptionsFilter());
      await options.storage.redis.ping();
      await app.listen(0, '127.0.0.1');
    }
    const request = (index, route, headers = {}) =>
      fetch(`http://127.0.0.1:${apps[index].getHttpServer().address().port}/rate-test/${route}`, {
        headers,
        signal: AbortSignal.timeout(8_000),
      });

    const first = await request(0, 'login');
    check(
      'Route-specific limit and remaining count are returned',
      first.status === 200 &&
        first.headers.get('x-ratelimit-limit') === '3' &&
        first.headers.get('x-ratelimit-remaining') === '2',
    );
    const second = await request(1, 'login');
    check(
      'A second HTTP instance shares the Redis counter',
      second.status === 200 && second.headers.get('x-ratelimit-remaining') === '1',
    );
    check('The last allowed request succeeds', (await request(0, 'login')).status === 200);
    const blocked = await request(1, 'login');
    check(
      'Excess requests return 429, Retry-After and the API error envelope',
      blocked.status === 429 &&
        Number(blocked.headers.get('retry-after')) > 0 &&
        (await blocked.json()).error?.code === 'TOO_MANY_REQUESTS' &&
        blocked.headers.get('cache-control') === 'no-store' &&
        !!blocked.headers.get('x-request-id'),
    );
    check(
      'An untrusted forwarded IP cannot bypass the limit',
      (await request(0, 'login', { 'X-Forwarded-For': '203.0.113.99' })).status === 429,
    );
    const normal = await request(0, 'normal');
    check(
      'Login limits do not leak into ordinary endpoints',
      normal.status === 200 && normal.headers.get('x-ratelimit-limit') === '120',
    );

    const simultaneous = await Promise.all(
      Array.from({ length: 16 }, (_, index) => request(index % 2, 'concurrent')),
    );
    check(
      'Concurrent requests across two instances admit exactly the configured quota',
      simultaneous.filter((response) => response.status === 200).length === 5 &&
        simultaneous.filter((response) => response.status === 429).length === 11,
    );
    const expiryKey = trackKey(runId + ':expiry');
    await stores[0].increment(expiryKey, 50, 1, 50, 'default');
    check(
      'Redis blocks within the configured window',
      (await stores[1].increment(expiryKey, 50, 1, 50, 'default')).isBlocked,
    );
    await delay(150);
    const renewed = await stores[0].increment(expiryKey, 50, 1, 50, 'default');
    check('Expired limits admit a new window', renewed.totalHits === 1 && !renewed.isBlocked);

    stores[1].redis.disconnect(false);
    const failed = await request(1, 'normal');
    const failedBody = await failed.json();
    check(
      'Redis failure denies requests without leaking connection details',
      failed.status === 500 &&
        failedBody.error?.code === 'INTERNAL_ERROR' &&
        failedBody.error?.message === 'Something went wrong' &&
        failedBody.error?.details === undefined,
    );
  } finally {
    try {
      if (keys.size && stores[0]?.redis.status !== 'end') {
        await stores[0].redis.del(...keys);
      }
    } finally {
      try {
        for (const app of apps) await app.close();
        for (const store of stores.slice(apps.length)) store.onModuleDestroy();
        for (const store of stores) {
          if (store.redis.status !== 'end') {
            await once(store.redis, 'end', { signal: AbortSignal.timeout(3_000) });
          }
        }
      } finally {
        for (const store of stores) store.redis.disconnect(false);
        if (environment === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = environment;
      }
    }
  }
  check(
    'Redis connections close after shutdown',
    stores.every((store) => store.redis.status === 'end'),
  );
  console.log(`Rate-limit integration: ${passed} passed, 0 failed`);
}

main().catch((error) => {
  console.error('Rate-limit integration failed:', error);
  process.exitCode = 1;
});
