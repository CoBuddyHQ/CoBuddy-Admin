import { CurrentUser, AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { Controller, Get, Put, Patch, Body, Param, Query } from '@nestjs/common';
import { ModerationService } from '../moderation.service';
import {
  ListRiskScoresDto,
  ReclassifyRiskScoreDto,
  UpdateRiskConfigDto,
} from '../dto/risk-scoring.dto';
import { AllowModule, Roles } from '@/common/decorators/auth.decorators';
import { StaffRole } from '@prisma/client';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { requireGlobal } from '@/common/auth/city-scope';

@Controller('moderation/risk-scores')
@AllowModule('risk-scoring')
export class RiskScoringController {
  constructor(private service: ModerationService) {}

  @Get()
  list(@Query() dto: ListRiskScoresDto, @CurrentUser() user: AuthStaffPayload) {
    return this.service.listRiskScores(dto, user);
  }

  @Get('config')
  getConfig() {
    return this.service.getRiskConfig();
  }

  @Put('config')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({ action: 'RISK_CONFIG_UPDATE', module: 'moderation', captureDiff: true })
  updateConfig(@Body() dto: UpdateRiskConfigDto, @CurrentUser() user: AuthStaffPayload) {
    requireGlobal(user);
    return this.service.updateRiskConfig(dto);
  }

  @Patch(':userId')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({ action: 'RISK_SCORE_RECLASSIFY', module: 'moderation', resourceIdParam: 'userId' })
  reclassify(
    @Param('userId') userId: string,
    @Body() dto: ReclassifyRiskScoreDto,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.reclassifyRiskScore(userId, dto.riskLevel, user);
  }

  @Get(':userId')
  getBreakdown(@Param('userId') userId: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.getRiskScoreBreakdown(userId, user);
  }
}
