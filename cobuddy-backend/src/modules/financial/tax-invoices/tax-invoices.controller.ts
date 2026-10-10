import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { TaxInvoicesService } from './tax-invoices.service';
import { ListInvoicesDto } from './dto/tax-invoices.dto';
import { Roles, AllowModule } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { CurrentUser, AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { StaffRole } from '@prisma/client';

@Controller('financial/tax-invoices')
@AllowModule('finance.tax-invoices')
@Roles(StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN)
export class TaxInvoicesController {
  constructor(private service: TaxInvoicesService) {}

  @Get('summary')
  summary() {
    return this.service.summary();
  }

  @Get()
  list(@Query() q: ListInvoicesDto) {
    return this.service.list(q);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.getOne(id);
  }

  @Post(':id/issue')
  @AuditLog({
    action: 'ISSUE_INVOICE',
    module: 'tax-invoices',
    resourceType: 'TaxInvoice',
    resourceIdParam: 'id',
  })
  issue(@Param('id') id: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.issue(id, user);
  }

  @Post(':id/mark-paid')
  @AuditLog({
    action: 'MARK_INVOICE_PAID',
    module: 'tax-invoices',
    resourceType: 'TaxInvoice',
    resourceIdParam: 'id',
  })
  markPaid(@Param('id') id: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.markPaid(id, user);
  }

  @Post(':id/cancel')
  @AuditLog({
    action: 'CANCEL_INVOICE',
    module: 'tax-invoices',
    resourceType: 'TaxInvoice',
    resourceIdParam: 'id',
  })
  cancel(@Param('id') id: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.cancel(id, user);
  }
}
