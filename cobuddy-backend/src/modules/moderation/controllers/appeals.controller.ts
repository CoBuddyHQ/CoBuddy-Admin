import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ModerationService } from '../moderation.service';
import { ListAppealsDto, UpdateAppealStatusDto, AddAppealNoteDto } from '../dto/appeals.dto';
import { AllowModule, Roles } from '@/common/decorators/auth.decorators';
import { StaffRole } from '@prisma/client';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { CurrentUser, AuthStaffPayload } from '@/common/decorators/current-user.decorator';

@Controller('moderation/appeals')
@AllowModule('appeals')
export class AppealsController {
  constructor(private service: ModerationService) {}

  @Get()
  list(@Query() dto: ListAppealsDto, @CurrentUser() user: AuthStaffPayload) {
    return this.service.listAppeals(dto, user);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.getAppeal(id, user);
  }

  @Patch(':id/status')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({
    action: 'APPEAL_STATUS_UPDATE',
    module: 'moderation',
    resourceIdParam: 'id',
    captureDiff: true,
  })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAppealStatusDto,
    @CurrentUser() u: AuthStaffPayload,
  ) {
    return this.service.updateAppealStatus(id, dto, u);
  }

  @Post(':id/add-note')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({ action: 'APPEAL_ADD_NOTE', module: 'moderation', resourceIdParam: 'id' })
  addNote(
    @Param('id') id: string,
    @Body() dto: AddAppealNoteDto,
    @CurrentUser() u: AuthStaffPayload,
  ) {
    return this.service.addAppealNote(id, dto, u);
  }
}
