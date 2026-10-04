import { Controller, Get, Post, Put, Param, Query, Body } from '@nestjs/common';
import { RefundsService } from './refunds.service';
import {
  ListRefundsDto,
  ApproveRefundDto,
  RejectRefundDto,
  BookingSettingsDto,
} from './dto/refunds.dto';
import { Roles, AllowModule } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { CurrentUser, AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { StaffRole } from '@prisma/client';

@Controller('financial/refunds')
@AllowModule('finance.refunds')
@Roles(StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN)
export class RefundsController {
  constructor(private service: RefundsService) {}

  @Get('summary')
  summary() {
    return this.service.summary();
  }

  @Get()
  list(@Query() q: ListRefundsDto) {
    return this.service.list(q);
  }

  @Get('settings/booking')
  bookingSettings() {
    return this.service.getBookingSettings();
  }

  @Put('settings/booking')
  @AuditLog({ action: 'UPDATE_BOOKING_POLICIES', module: 'refunds' })
  updateBookingSettings(@Body() dto: BookingSettingsDto) {
    return this.service.updateBookingSettings(dto);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.getOne(id);
  }

  @Post(':id/approve')
  @AuditLog({
    action: 'APPROVE_REFUND',
    module: 'refunds',
    resourceType: 'Refund',
    resourceIdParam: 'id',
  })
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveRefundDto,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.approve(id, dto, user);
  }

  @Post(':id/process')
  @AuditLog({
    action: 'PROCESS_REFUND',
    module: 'refunds',
    resourceType: 'Refund',
    resourceIdParam: 'id',
  })
  process(@Param('id') id: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.process(id, user);
  }

  @Post(':id/reject')
  @AuditLog({
    action: 'REJECT_REFUND',
    module: 'refunds',
    resourceType: 'Refund',
    resourceIdParam: 'id',
  })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectRefundDto,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.reject(id, dto, user);
  }
}
