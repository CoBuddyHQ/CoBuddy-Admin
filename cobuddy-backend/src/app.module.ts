import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { createThrottleOptions } from './config/throttling';

import { validate } from '@/config/env.validation';
import { PrismaModule } from '@/prisma/prisma.module';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';

import { AuthModule } from '@/modules/auth/auth.module';
import { EmployeesModule } from '@/modules/employees/employees.module';
import { AuditLogsModule } from '@/modules/audit-logs/audit-logs.module';
import { MasterDataModule } from '@/modules/master-data/master-data.module';
import { SystemModule } from '@/modules/system/system.module';
import { CustomersModule } from '@/modules/customers/customers.module';
import { CompanionsModule } from '@/modules/companions/companions.module';
import { CompanionApplicationsModule } from '@/modules/companion-applications/companion-applications.module';
import { WalletsModule } from '@/modules/wallets/wallets.module';
import { PayoutsModule } from '@/modules/financial/payouts/payouts.module';
import { RefundsModule } from '@/modules/financial/refunds/refunds.module';
import { FraudDetectionModule } from '@/modules/financial/fraud-detection/fraud.module';
import { TaxInvoicesModule } from '@/modules/financial/tax-invoices/tax-invoices.module';
import { RevenueReportsModule } from '@/modules/financial/revenue-reports/revenue-reports.module';
import { ReconciliationModule } from '@/modules/financial/reconciliation/reconciliation.module';
import { ModerationModule } from '@/modules/moderation/moderation.module';
import { TrustScoreModule } from '@/modules/trust-score/trust-score.module';
import { VerificationModule } from '@/modules/verification/verification.module';
import { OperationsApiModule } from '@/modules/operations-api/operations-api.module';
import { SafetyApiModule } from '@/modules/safety-api/safety-api.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: ['.env', '.env.local'],
    }),
    ThrottlerModule.forRootAsync({
      useFactory: createThrottleOptions,
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    EmployeesModule,
    AuditLogsModule,
    MasterDataModule,
    SystemModule,
    CustomersModule,
    CompanionsModule,
    CompanionApplicationsModule,
    WalletsModule,
    PayoutsModule,
    RefundsModule,
    FraudDetectionModule,
    TaxInvoicesModule,
    RevenueReportsModule,
    ReconciliationModule,
    ModerationModule,
    TrustScoreModule,
    VerificationModule,
    OperationsApiModule,
    SafetyApiModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
