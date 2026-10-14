import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { ListCasesDto } from './dto/list-cases.dto';
import { DecisionDto } from './dto/decision.dto';
import { AllowModule, Roles } from '@/common/decorators/auth.decorators';
import { StaffRole } from '@prisma/client';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { CurrentUser, AuthStaffPayload } from '@/common/decorators/current-user.decorator';

@Controller('verification/cases')
@AllowModule('verification')
export class VerificationCasesController {
  constructor(private service: VerificationService) {}

  @Get()
  list(@Query() dto: ListCasesDto, @CurrentUser() user: AuthStaffPayload) {
    return this.service.listCases(dto, user);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.getCase(id, user);
  }

  @Post(':id/decision')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({
    action: 'VERIFICATION_DECISION',
    module: 'verification',
    resourceType: 'VerificationCase',
    resourceIdParam: 'id',
    captureDiff: true,
  })
  decide(@Param('id') id: string, @Body() dto: DecisionDto, @CurrentUser() u: AuthStaffPayload) {
    return this.service.decideCase(id, dto, u);
  }

  @Post('re-run-auto-check/:caseId')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({
    action: 'VERIFICATION_RERUN_AUTO',
    module: 'verification',
    resourceType: 'VerificationCase',
    resourceIdParam: 'caseId',
  })
  rerunAuto(@Param('caseId') caseId: string, @CurrentUser() u: AuthStaffPayload) {
    return this.service.rerunAutoCheck(caseId, u);
  }
}
