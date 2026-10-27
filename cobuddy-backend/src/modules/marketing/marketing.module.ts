import { Module } from '@nestjs/common';
import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';
import { InternalServiceGuard } from '@/common/guards/internal-service.guard';

@Module({ controllers: [MarketingController], providers: [MarketingService, InternalServiceGuard] })
export class MarketingModule {}
