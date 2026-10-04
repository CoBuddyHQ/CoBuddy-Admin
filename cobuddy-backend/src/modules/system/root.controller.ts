import { Controller, Get, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Public } from '@/common/decorators/auth.decorators';
import { PrismaService } from '@/prisma/prisma.module';

@Controller()
export class RootController implements OnModuleDestroy {
  private readonly redis: Redis;
  constructor(
    private prisma: PrismaService,
    config: ConfigService,
  ) {
    this.redis = new Redis(config.getOrThrow<string>('REDIS_URL'), {
      lazyConnect: true,
      connectTimeout: 2000,
      commandTimeout: 2000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    this.redis.on('error', () => undefined);
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  @Get()
  @Public()
  root() {
    return { data: { name: 'CoBuddy Admin Backend', version: '0.1.0', health: '/api/health' } };
  }

  @Get('health')
  @Public()
  async health() {
    const [database, cache] = await Promise.allSettled([
      this.prisma.$queryRaw`SELECT 1`,
      this.redis.ping(),
    ]);
    const services = {
      postgres: database.status === 'fulfilled' ? 'connected' : 'error',
      redis: cache.status === 'fulfilled' ? 'connected' : 'error',
    };
    if (database.status === 'rejected' || cache.status === 'rejected') {
      throw new ServiceUnavailableException({
        message: 'Dependencies unavailable',
        details: services,
      });
    }
    return {
      data: { status: 'ok', timestamp: new Date().toISOString(), services, version: '0.1.0' },
    };
  }
}
