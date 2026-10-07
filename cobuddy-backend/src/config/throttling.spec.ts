import { ConfigService } from '@nestjs/config';
import { createThrottleOptions } from './throttling';
import { ExecutionContext } from '@nestjs/common';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';

jest.mock('@nest-lab/throttler-storage-redis', () => ({
  ThrottlerStorageRedisService: jest.fn().mockImplementation(() => ({ increment: jest.fn() })),
}));
describe('rate limiting configuration', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses one default bucket so auth-specific limits do not apply to other APIs', () => {
    const options = createThrottleOptions(new ConfigService({ NODE_ENV: 'development' }));
    expect(options).toMatchObject({ throttlers: [{ name: 'default', ttl: 60000, limit: 120 }] });
  });
  it.each(['production', 'staging'])('uses bounded Redis requests in %s', (environment) => {
    const options = createThrottleOptions(
      new ConfigService({ NODE_ENV: environment, REDIS_URL: 'redis://localhost:6379/0' }),
    );
    if (Array.isArray(options)) throw new Error('Expected named throttler options');
    expect(ThrottlerStorageRedisService).toHaveBeenCalledWith('redis://localhost:6379/0', {
      connectTimeout: 5_000,
      commandTimeout: 3_000,
      maxRetriesPerRequest: 1,
    });
    expect(options.storage).toBeDefined();
    expect(options.skipIf?.({} as ExecutionContext)).toBe(false);
  });
  it.each(['development', 'test'])('does not connect to Redis in %s', (environment) => {
    const options = createThrottleOptions(new ConfigService({ NODE_ENV: environment }));
    if (Array.isArray(options)) throw new Error('Expected named throttler options');
    expect(ThrottlerStorageRedisService).not.toHaveBeenCalled();
    expect(options.storage).toBeUndefined();
    expect(options.skipIf?.({} as ExecutionContext)).toBe(environment === 'test');
  });
  it('fails closed when the production Redis URL is absent', () => {
    const redisUrl = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    try {
      expect(() => createThrottleOptions(new ConfigService({ NODE_ENV: 'production' }))).toThrow();
    } finally {
      if (redisUrl !== undefined) process.env.REDIS_URL = redisUrl;
    }
  });
});
