import { Controller, Get, Post, Param, Query, Req } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { EscrowQueryDto } from './dto/wallet-query.dto';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';
import { AllowModule, Roles } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { StaffRole } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';

@Controller('financial')
@AllowModule('finance.escrow')
@Roles(StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN)
export class WalletsController {
  constructor(private service: WalletsService) {}

  @Get('wallets')
  listWallets(@Query() q: PaginationQueryDto) {
    return this.service.listWallets(q);
  }

  @Get('wallets/ledger/:walletId')
  getLedger(@Param('walletId') walletId: string, @Query() q: PaginationQueryDto) {
    return this.service.getLedger(walletId, q);
  }

  @Get('wallets/:ownerType/:ownerId')
  getWallet(
    @Param('ownerType') ownerType: 'CUSTOMER' | 'COMPANION',
    @Param('ownerId') ownerId: string,
  ) {
    return this.service.getWallet(ownerType, ownerId);
  }

  @Get('escrow')
  listEscrow(@Query() q: EscrowQueryDto, @Req() req: any) {
    return this.service.listEscrow(q, req);
  }

  @Post('escrow/:bookingId/release')
  @AuditLog({
    action: 'RELEASE_ESCROW',
    module: 'wallets',
    resourceType: 'Booking',
    resourceIdParam: 'bookingId',
  })
  releaseEscrow(@Param('bookingId') bookingId: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.releaseEscrow(bookingId, user);
  }

  @Post('escrow/release-stale')
  @AuditLog({ action: 'RELEASE_STALE_ESCROW', module: 'wallets', resourceType: 'Booking' })
  releaseStaleEscrow(@CurrentUser() user: AuthStaffPayload) {
    return this.service.releaseStaleEscrow(user);
  }
}
