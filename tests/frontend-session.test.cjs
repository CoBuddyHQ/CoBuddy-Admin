const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const axios = require('axios');

function createClient(initial = { admin_token: 'expired', admin_refresh_token: 'refresh-old' }) {
  const values = new Map(Object.entries(initial));
  const events = [];
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, '../src/lib/api/client.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  vm.runInNewContext(compiled, {
    exports,
    require,
    process,
    Event,
    window: { dispatchEvent: (event) => events.push(event.type) },
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  });
  return {
    client: exports.default,
    auth: exports.authApi,
    clear: exports.clearAuthSession,
    values,
    events,
  };
}

function response(config, data, status = 200) {
  return { config, data: { data }, status, statusText: String(status), headers: {} };
}

function unauthorized(config) {
  throw new axios.AxiosError(
    'Unauthorized',
    'ERR_BAD_REQUEST',
    config,
    null,
    response(config, {}, 401),
  );
}

test('protected auth/me refreshes once and returns the current staff profile', async () => {
  const ctx = createClient();
  const calls = [];
  ctx.client.defaults.adapter = async (config) => {
    calls.push(config.url);
    if (config.url === '/auth/refresh')
      return response(config, { accessToken: 'new-access', refreshToken: 'refresh-new' });
    if (!config._retry) return unauthorized(config);
    assert.equal(config.headers.Authorization, 'Bearer new-access');
    return response(config, {
      id: 'staff',
      name: 'Staff',
      email: 'staff@example.test',
      roles: ['MODERATOR'],
      cityScopeIds: ['city'],
      twoFactorEnabled: true,
    });
  };
  const profile = await ctx.auth.me();
  assert.equal(profile.id, 'staff');
  assert.equal(profile.cityScope[0], 'city');
  assert.equal(profile.twoFactorEnabled, true);
  assert.deepEqual(calls, ['/auth/me', '/auth/refresh', '/auth/me']);
  assert.equal(ctx.values.get('admin_refresh_token'), 'refresh-new');
});

test('concurrent unauthorized API requests share one refresh', async () => {
  const ctx = createClient();
  let refreshes = 0;
  ctx.client.defaults.adapter = async (config) => {
    if (config.url === '/auth/refresh') {
      refreshes++;
      await new Promise((resolve) => setImmediate(resolve));
      return response(config, { accessToken: 'new-access', refreshToken: 'refresh-new' });
    }
    if (!config._retry) return unauthorized(config);
    return response(config, []);
  };
  await Promise.all([ctx.client.get('/customers'), ctx.client.get('/companions')]);
  assert.equal(refreshes, 1);
});

test('public login failures do not refresh or clear an existing session', async () => {
  const ctx = createClient();
  let requests = 0;
  ctx.client.defaults.adapter = async (config) => {
    requests++;
    return unauthorized(config);
  };
  await assert.rejects(ctx.auth.login('user@example.test', 'not-a-real-password'));
  assert.equal(requests, 1);
  assert.equal(ctx.values.get('admin_token'), 'expired');
  assert.deepEqual(ctx.events, []);
});

test('public invitation failures do not refresh or clear an existing session', async () => {
  const ctx = createClient();
  let requests = 0;
  ctx.client.defaults.adapter = async (config) => {
    requests++;
    return unauthorized(config);
  };
  await assert.rejects(ctx.client.post('/employees/staff-id/accept-invite', {}));
  assert.equal(requests, 1);
  assert.equal(ctx.values.get('admin_token'), 'expired');
  assert.deepEqual(ctx.events, []);
});

test('missing refresh token clears the invalid access token and expires auth', async () => {
  const ctx = createClient({ admin_token: 'expired' });
  ctx.client.defaults.adapter = async (config) => unauthorized(config);
  await assert.rejects(ctx.client.get('/customers'));
  assert.equal(ctx.values.size, 0);
  assert.deepEqual(ctx.events, ['auth-expired']);
});

test('a rejected refresh clears session tokens', async () => {
  const ctx = createClient();
  ctx.client.defaults.adapter = async (config) => unauthorized(config);
  await assert.rejects(ctx.client.get('/customers'));
  assert.equal(ctx.values.size, 0);
  assert.deepEqual(ctx.events, ['auth-expired']);
});

test('network failure during refresh preserves the session for retry', async () => {
  const ctx = createClient();
  ctx.client.defaults.adapter = async (config) => {
    if (config.url === '/auth/refresh')
      throw new axios.AxiosError('Offline', 'ERR_NETWORK', config);
    return unauthorized(config);
  };
  await assert.rejects(ctx.client.get('/customers'));
  assert.equal(ctx.values.get('admin_refresh_token'), 'refresh-old');
  assert.deepEqual(ctx.events, []);
});

test('a second 401 after refresh ends the session without a retry loop', async () => {
  const ctx = createClient();
  let requests = 0;
  ctx.client.defaults.adapter = async (config) => {
    requests++;
    if (config.url === '/auth/refresh')
      return response(config, { accessToken: 'new-access', refreshToken: 'refresh-new' });
    return unauthorized(config);
  };
  await assert.rejects(ctx.client.get('/customers'));
  assert.equal(requests, 3);
  assert.equal(ctx.values.size, 0);
  assert.deepEqual(ctx.events, ['auth-expired']);
});

test('late refresh completion cannot restore tokens after logout', async () => {
  const ctx = createClient();
  let releaseRefresh;
  const refreshStarted = new Promise((resolve) => {
    ctx.client.defaults.adapter = async (config) => {
      if (config.url === '/auth/refresh') {
        resolve();
        await new Promise((release) => {
          releaseRefresh = release;
        });
        return response(config, { accessToken: 'new-access', refreshToken: 'refresh-new' });
      }
      return unauthorized(config);
    };
  });
  const pending = ctx.client.get('/customers');
  await refreshStarted;
  ctx.clear();
  releaseRefresh();
  await assert.rejects(pending, /session changed/);
  assert.equal(ctx.values.size, 0);
});

test('logout retry revokes the rotated refresh token', async () => {
  const ctx = createClient();
  ctx.client.defaults.adapter = async (config) => {
    if (config.url === '/auth/refresh')
      return response(config, { accessToken: 'new-access', refreshToken: 'refresh-new' });
    if (!config._retry) return unauthorized(config);
    assert.equal(JSON.parse(config.data).refreshToken, 'refresh-new');
    return response(config, { ok: true });
  };
  await ctx.auth.logout('refresh-old');
});
