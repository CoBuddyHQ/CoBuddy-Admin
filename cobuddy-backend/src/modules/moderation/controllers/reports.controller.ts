import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ModerationService } from '../moderation.service';
import {
  ListReportsDto,
  AssignReportDto,
  UpdateReportStatusDto,
  BanUserFromReportDto,
  IssueWarningDto,
} from '../dto/reports.dto';
import { AllowModule, Roles } from '@/common/decorators/auth.decorators';
import { StaffRole } from '@prisma/client';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { CurrentUser, AuthStaffPayload } from '@/common/decorators/current-user.decorator';

@Controller('moderation/reports')
@AllowModule('reports')
export class ReportsController {
  constructor(private service: ModerationService) {}

  @Get()
  list(@Query() dto: ListReportsDto, @CurrentUser() user: AuthStaffPayload) {
    return this.service.listReports(dto, user);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.getReport(id, user);
  }

  @Post(':id/assign')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({
    action: 'REPORT_ASSIGN',
    module: 'moderation',
    resourceType: 'UserReport',
    resourceIdParam: 'id',
    captureDiff: true,
  })
  assign(
    @Param('id') id: string,
    @Body() dto: AssignReportDto,
    @CurrentUser() u: AuthStaffPayload,
  ) {
    return this.service.assignReport(id, dto, u, false);
  }

  @Post(':id/assign-me')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({
    action: 'REPORT_ASSIGN_SELF',
    module: 'moderation',
    resourceType: 'UserReport',
    resourceIdParam: 'id',
    captureDiff: true,
  })
  assignSelf(@Param('id') id: string, @CurrentUser() u: AuthStaffPayload) {
    return this.service.assignReport(id, null, u, true);
  }

  @Patch(':id/status')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({
    action: 'REPORT_STATUS_UPDATE',
    module: 'moderation',
    resourceType: 'UserReport',
    resourceIdParam: 'id',
    captureDiff: true,
  })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReportStatusDto,
    @CurrentUser() u: AuthStaffPayload,
  ) {
    return this.service.updateReportStatus(id, dto, u);
  }

  @Post(':id/ban-user')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({
    action: 'REPORT_BAN_USER',
    module: 'moderation',
    resourceType: 'UserReport',
    resourceIdParam: 'id',
  })
  banUser(
    @Param('id') id: string,
    @Body() dto: BanUserFromReportDto,
    @CurrentUser() u: AuthStaffPayload,
  ) {
    return this.service.banUserFromReport(id, dto, u);
  }

  @Post(':id/issue-warning')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({
    action: 'REPORT_ISSUE_WARNING',
    module: 'moderation',
    resourceType: 'UserReport',
    resourceIdParam: 'id',
  })
  issueWarning(
    @Param('id') id: string,
    @Body() dto: IssueWarningDto,
    @CurrentUser() u: AuthStaffPayload,
  ) {
    return this.service.issueWarning(id, dto, u);
  }
}
