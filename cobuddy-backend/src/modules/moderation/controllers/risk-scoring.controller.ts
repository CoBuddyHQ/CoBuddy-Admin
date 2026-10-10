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

@Controller('moderation/risk-scores')
@AllowModule('risk-scoring')
export class RiskScoringController {
  constructor(private service: ModerationService) {}

  @Get()
  list(@Query() dto: ListRiskScoresDto) {
    return this.service.listRiskScores(dto);
  }

  @Get('config')
  getConfig() {
    return this.service.getRiskConfig();
  }

  @Put('config')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({ action: 'RISK_CONFIG_UPDATE', module: 'moderation', captureDiff: true })
  updateConfig(@Body() dto: UpdateRiskConfigDto) {
    return this.service.updateRiskConfig(dto);
  }

  @Patch(':userId')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({ action: 'RISK_SCORE_RECLASSIFY', module: 'moderation', resourceIdParam: 'userId' })
  reclassify(@Param('userId') userId: string, @Body() dto: ReclassifyRiskScoreDto) {
    return this.service.reclassifyRiskScore(userId, dto.riskLevel);
  }

  @Get(':userId')
  getBreakdown(@Param('userId') userId: string) {
    return this.service.getRiskScoreBreakdown(userId);
  }
}
