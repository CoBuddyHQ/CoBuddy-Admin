import { Controller, Get, Patch, Post, Param, Body, Query, Req } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { BookingHistoryService } from './services/booking-history.service';
import { TransactionHistoryService } from './services/transaction-history.service';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { UpdateCustomerStatusDto } from './dto/update-status.dto';
import { UpdateCustomerVerificationDto } from './dto/update-verification.dto';
import { AdjustWalletDto } from './dto/adjust-wallet.dto';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';
import { AllowModule, Roles, CityScoped } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { StaffRole } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';

@Controller('customers')
@AllowModule('customers.list')
@CityScoped('cityId', 'customer')
export class CustomersController {
  constructor(
    private service: CustomersService,
    private bookingHistory: BookingHistoryService,
    private transactionHistory: TransactionHistoryService,
  ) {}

  @Get()
  findAll(@Query() q: CustomerQueryDto, @Req() req: any) {
    return this.service.findAll(q, req);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @Roles(StaffRole.SUPPORT_LEAD, StaffRole.MODERATOR, StaffRole.SUPER_ADMIN)
  @AuditLog({
    action: 'UPDATE_CUSTOMER_STATUS',
    module: 'customers',
    resourceType: 'Customer',
    resourceIdParam: 'id',
  })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateCustomerStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Patch(':id/verification-status')
  @Roles(StaffRole.MODERATOR, StaffRole.SUPER_ADMIN)
  @AuditLog({
    action: 'UPDATE_CUSTOMER_VERIFICATION',
    module: 'customers',
    resourceType: 'Customer',
    resourceIdParam: 'id',
  })
  updateVerificationStatus(@Param('id') id: string, @Body() dto: UpdateCustomerVerificationDto) {
    return this.service.updateVerificationStatus(id, dto);
  }

  @Get(':id/booking-history')
  getBookingHistory(@Param('id') id: string, @Query() q: PaginationQueryDto) {
    return this.bookingHistory.getBookingHistory(id, q);
  }

  @Get(':id/transactions')
  getTransactions(@Param('id') id: string, @Query() q: PaginationQueryDto) {
    return this.transactionHistory.getTransactions(id, q);
  }

  @Get(':id/reports')
  getReports(@Param('id') id: string, @Query() q: PaginationQueryDto) {
    return this.service.getReports(id, q);
  }

  @Post(':id/adjust-wallet')
  @Roles(StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN)
  @AuditLog({
    action: 'ADJUST_CUSTOMER_WALLET',
    module: 'customers',
    resourceType: 'Customer',
    resourceIdParam: 'id',
  })
  adjustWallet(
    @Param('id') id: string,
    @Body() dto: AdjustWalletDto,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.adjustWallet(id, dto, user);
  }

  @Get(':id/tickets')
  getTickets(@Param('id') id: string, @Query() q: PaginationQueryDto) {
    return this.service.getTickets(id, q);
  }
}
