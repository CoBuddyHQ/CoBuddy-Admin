import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CityScopeGuard } from '@/common/guards/city-scope.guard';
import { AuditLogInterceptor } from '@/common/interceptors/audit-log.interceptor';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.getOrThrow('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: cfg.get('JWT_ACCESS_TTL') || '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: CityScopeGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
  exports: [AuthService],
})
export class AuthModule {}
