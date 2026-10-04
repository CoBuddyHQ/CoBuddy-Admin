import { Module } from '@nestjs/common';
import { CompanionsController } from './companions.controller';
import { CompanionsService } from './companions.service';
import { TrustScoreHistoryService } from './services/trust-score-history.service';
import { SessionHistoryService } from './services/session-history.service';
import { EarningsBreakdownService } from './services/earnings-breakdown.service';

@Module({
  controllers: [CompanionsController],
  providers: [
    CompanionsService,
    TrustScoreHistoryService,
    SessionHistoryService,
    EarningsBreakdownService,
  ],
  exports: [CompanionsService],
})
export class CompanionsModule {}
