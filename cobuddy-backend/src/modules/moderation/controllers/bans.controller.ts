import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ModerationService } from '../moderation.service';
import { CreateBanDto, LiftBanDto, ListBansDto } from '../dto/bans.dto';
import { AllowModule, Roles } from '@/common/decorators/auth.decorators';
import { StaffRole } from '@prisma/client';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { CurrentUser, AuthStaffPayload } from '@/common/decorators/current-user.decorator';

@Controller('moderation/bans')
@AllowModule('bans')
export class BansController {
  constructor(private service: ModerationService) {}

  @Get()
  list(@Query() dto: ListBansDto, @CurrentUser() user: AuthStaffPayload) {
    return this.service.listBans(dto, user);
  }

  @Post()
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({ action: 'BAN_CREATE', module: 'moderation' })
  create(@Body() dto: CreateBanDto, @CurrentUser() u: AuthStaffPayload) {
    return this.service.createBan(dto, u);
  }

  @Patch(':id/lift')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({ action: 'BAN_LIFT', module: 'moderation', resourceIdParam: 'id', captureDiff: true })
  lift(@Param('id') id: string, @Body() dto: LiftBanDto, @CurrentUser() u: AuthStaffPayload) {
    return this.service.liftBan(id, dto, u);
  }

  @Get(':id/appeals')
  getAppeals(@Param('id') id: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.getBanAppeals(id, user);
  }
}
