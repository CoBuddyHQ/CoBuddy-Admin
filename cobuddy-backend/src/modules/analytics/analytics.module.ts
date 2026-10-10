import { Module, Controller, Get } from '@nestjs/common';
import { AllowModule } from '@/common/decorators/auth.decorators';
import { CurrentUser, AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}
  @Get('growth')
  @AllowModule('analytics-growth')
  growth(@CurrentUser() user: AuthStaffPayload) {
    return this.service.growth(user);
  }
  @Get('sessions')
  @AllowModule('analytics-operational')
  sessions(@CurrentUser() user: AuthStaffPayload) {
    return this.service.sessions(user);
  }
  @Get('market')
  @AllowModule('analytics-financial')
  market(@CurrentUser() user: AuthStaffPayload) {
    return this.service.market(user);
  }
}

@Module({ controllers: [AnalyticsController], providers: [AnalyticsService] })
export class AnalyticsModule {}
