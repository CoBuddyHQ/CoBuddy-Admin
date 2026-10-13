import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { TrustScoreService } from './trust-score.service';
import { CreateRuleDto, UpdateRuleDto } from './dto/trust-score.dto';
import { AllowModule, Roles } from '@/common/decorators/auth.decorators';
import { StaffRole } from '@prisma/client';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { CurrentUser, AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { requireGlobal } from '@/common/auth/city-scope';

@Controller('trust-score')
@AllowModule('trust-score')
export class TrustScoreController {
  constructor(private service: TrustScoreService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthStaffPayload) {
    return this.service.getDashboard(user);
  }

  @Get('rules')
  getRules() {
    return this.service.getRules();
  }

  @Post('rules')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({ action: 'TRUST_SCORE_RULE_CREATE', module: 'trust-score' })
  createRule(@Body() dto: CreateRuleDto, @CurrentUser() user: AuthStaffPayload) {
    requireGlobal(user);
    return this.service.createRule(dto);
  }

  @Patch('rules/:id')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({
    action: 'TRUST_SCORE_RULE_UPDATE',
    module: 'trust-score',
    resourceIdParam: 'id',
    captureDiff: true,
  })
  updateRule(
    @Param('id') id: string,
    @Body() dto: UpdateRuleDto,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    requireGlobal(user);
    return this.service.updateRule(id, dto);
  }

  @Delete('rules/:id')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({ action: 'TRUST_SCORE_RULE_DELETE', module: 'trust-score', resourceIdParam: 'id' })
  deleteRule(@Param('id') id: string, @CurrentUser() user: AuthStaffPayload) {
    requireGlobal(user);
    return this.service.deleteRule(id);
  }

  @Post('recompute/:companionId')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({
    action: 'TRUST_SCORE_RECOMPUTE',
    module: 'trust-score',
    resourceType: 'Companion',
    resourceIdParam: 'companionId',
    captureDiff: true,
  })
  recompute(@Param('companionId') companionId: string, @CurrentUser() u: AuthStaffPayload) {
    return this.service.recompute(companionId, u);
  }

  @Get(':companionId/history')
  history(@Param('companionId') companionId: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.getHistory(companionId, user);
  }
}
