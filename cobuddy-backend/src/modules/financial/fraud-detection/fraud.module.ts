import { Module } from '@nestjs/common';
import { FraudDetectionController } from './fraud.controller';
import { FraudDetectionService } from './fraud.service';

@Module({
  controllers: [FraudDetectionController],
  providers: [FraudDetectionService],
  exports: [FraudDetectionService],
})
export class FraudDetectionModule {}
