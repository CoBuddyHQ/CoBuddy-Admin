import { ConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';

export function createThrottleOptions(config: ConfigService): ThrottlerModuleOptions {
  const environment = config.get<string>('NODE_ENV');
  return {
    // Named throttlers all apply to every route. Use one bucket with per-route overrides.
    throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }],
    skipIf: () => environment === 'test',
    ...(['production', 'staging'].includes(environment || '')
      ? {
          storage: new ThrottlerStorageRedisService(config.getOrThrow<string>('REDIS_URL'), {
            connectTimeout: 5_000,
            commandTimeout: 3_000,
            maxRetriesPerRequest: 1,
          }),
        }
      : {}),
  };
}
