import { Module } from '@nestjs/common';
import { VerificationCasesController } from './verification-cases.controller';
import { ThresholdsController } from './thresholds.controller';
import { VerificationService } from './verification.service';

@Module({
  controllers: [VerificationCasesController, ThresholdsController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
