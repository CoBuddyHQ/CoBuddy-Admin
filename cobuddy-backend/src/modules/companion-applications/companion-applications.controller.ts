import { Controller, Get, Patch, Post, Param, Body, Query, Req } from '@nestjs/common';
import { CompanionApplicationsService } from './companion-applications.service';
import { CompanionApplicationQueryDto } from './dto/companion-application-query.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { ScheduleInterviewDto } from './dto/schedule-interview.dto';
import { RejectApplicationDto } from './dto/reject-application.dto';
import { AddApplicationNoteDto } from './dto/add-application-note.dto';
import { AllowModule } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';

@Controller('companion-applications')
@AllowModule('companion-applications')
export class CompanionApplicationsController {
  constructor(private service: CompanionApplicationsService) {}

  @Get()
  findAll(@Query() q: CompanionApplicationQueryDto, @Req() req: any) {
    return this.service.findAll(q, req);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @AuditLog({
    action: 'UPDATE_APPLICATION_STATUS',
    module: 'companion-applications',
    resourceType: 'CompanionApplication',
    resourceIdParam: 'id',
  })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.updateStatus(id, dto, user);
  }

  @Post(':id/schedule-interview')
  @AuditLog({
    action: 'SCHEDULE_INTERVIEW',
    module: 'companion-applications',
    resourceType: 'CompanionApplication',
    resourceIdParam: 'id',
  })
  scheduleInterview(@Param('id') id: string, @Body() dto: ScheduleInterviewDto) {
    return this.service.scheduleInterview(id, dto);
  }

  @Post(':id/approve')
  @AuditLog({
    action: 'APPROVE_APPLICATION',
    module: 'companion-applications',
    resourceType: 'CompanionApplication',
    resourceIdParam: 'id',
  })
  approve(@Param('id') id: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.approve(id, user);
  }

  @Post(':id/reject')
  @AuditLog({
    action: 'REJECT_APPLICATION',
    module: 'companion-applications',
    resourceType: 'CompanionApplication',
    resourceIdParam: 'id',
  })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectApplicationDto,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.reject(id, dto, user);
  }

  @Post(':id/add-note')
  @AuditLog({
    action: 'ADD_APPLICATION_NOTE',
    module: 'companion-applications',
    resourceType: 'CompanionApplication',
    resourceIdParam: 'id',
  })
  addNote(
    @Param('id') id: string,
    @Body() dto: AddApplicationNoteDto,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.addNote(id, dto, user);
  }
}
