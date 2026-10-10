import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import {
  ListPayoutsDto,
  HoldPayoutDto,
  ProcessPayoutDto,
  MarkPaidDto,
  MarkFailedDto,
} from './dto/payouts.dto';
import { Roles, AllowModule } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { CurrentUser, AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { StaffRole } from '@prisma/client';

@Controller('financial/payouts')
@AllowModule('finance.payouts')
@Roles(StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN)
export class PayoutsController {
  constructor(private service: PayoutsService) {}

  @Get('summary')
  summary() {
    return this.service.summary();
  }

  @Get()
  list(@Query() q: ListPayoutsDto) {
    return this.service.list(q);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.getOne(id);
  }

  @Post(':id/hold')
  @AuditLog({
    action: 'HOLD_PAYOUT',
    module: 'payouts',
    resourceType: 'Payout',
    resourceIdParam: 'id',
  })
  hold(@Param('id') id: string, @Body() dto: HoldPayoutDto, @CurrentUser() user: AuthStaffPayload) {
    return this.service.hold(id, dto, user);
  }

  @Post(':id/lift-hold')
  @AuditLog({
    action: 'LIFT_PAYOUT_HOLD',
    module: 'payouts',
    resourceType: 'Payout',
    resourceIdParam: 'id',
  })
  liftHold(@Param('id') id: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.liftHold(id, user);
  }

  @Post(':id/process')
  @AuditLog({
    action: 'PROCESS_PAYOUT',
    module: 'payouts',
    resourceType: 'Payout',
    resourceIdParam: 'id',
  })
  process(
    @Param('id') id: string,
    @Body() dto: ProcessPayoutDto,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.process(id, dto, user);
  }

  @Post(':id/mark-paid')
  @AuditLog({
    action: 'MARK_PAYOUT_PAID',
    module: 'payouts',
    resourceType: 'Payout',
    resourceIdParam: 'id',
  })
  markPaid(
    @Param('id') id: string,
    @Body() dto: MarkPaidDto,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.markPaid(id, dto, user);
  }

  @Post(':id/mark-failed')
  @AuditLog({
    action: 'MARK_PAYOUT_FAILED',
    module: 'payouts',
    resourceType: 'Payout',
    resourceIdParam: 'id',
  })
  markFailed(
    @Param('id') id: string,
    @Body() body: MarkFailedDto,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.markFailed(id, body.reason, user);
  }
}
