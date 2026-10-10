import { Module } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { ReportsController } from './controllers/reports.controller';
import { BansController } from './controllers/bans.controller';
import { FlaggedChatsController } from './controllers/flagged-chats.controller';
import { ChatSettingsController } from './controllers/chat-settings.controller';
import { RiskScoringController } from './controllers/risk-scoring.controller';
import { ReviewsController } from './controllers/reviews.controller';
import { AppealsController } from './controllers/appeals.controller';

@Module({
  controllers: [
    ReportsController,
    BansController,
    FlaggedChatsController,
    ChatSettingsController,
    RiskScoringController,
    ReviewsController,
    AppealsController,
  ],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
