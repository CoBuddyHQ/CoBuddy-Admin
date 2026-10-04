import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.module';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';
import { EscrowQueryDto } from './dto/wallet-query.dto';
import { applyCityScope } from '@/common/guards/city-scope.guard';
import {
  BookingStatus,
  TransactionStatus,
  TransactionType,
  WalletTransactionCategory,
  Prisma,
} from '@prisma/client';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  private unreleasedEscrow(): Prisma.BookingWhereInput {
    return {
      walletTransactions: {
        some: {
          transactionType: TransactionType.DEBIT,
          category: WalletTransactionCategory.BOOKING_CHARGE,
          status: TransactionStatus.SUCCESS,
        },
        none: {
          status: TransactionStatus.SUCCESS,
          metadata: { path: ['escrowReleased'], equals: true },
        },
      },
    };
  }

  async listWallets(q: PaginationQueryDto) {
    const [totalItems, data] = await this.prisma.$transaction([
      this.prisma.wallet.count(),
      this.prisma.wallet.findMany({
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { updatedAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          companion: { select: { id: true, name: true } },
        },
      }),
    ]);
    const totalPages = Math.ceil(totalItems / q.pageSize);
    return {
      data,
      meta: {
        page: q.page,
        pageSize: q.pageSize,
        totalItems,
        totalPages,
        hasNext: q.page < totalPages,
        hasPrevious: q.page > 1,
      },
    };
  }

  async getWallet(ownerType: 'CUSTOMER' | 'COMPANION', ownerId: string) {
    if (!['CUSTOMER', 'COMPANION'].includes(ownerType))
      throw new BadRequestException('Invalid wallet owner type');
    const where: Prisma.WalletWhereInput = { ownerType };
    if (ownerType === 'CUSTOMER') {
      where.customerId = ownerId;
    } else {
      where.companionId = ownerId;
    }

    const wallet = await this.prisma.wallet.findFirst({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        companion: { select: { id: true, name: true } },
      },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return { data: wallet };
  }

  async getLedger(walletId: string, q: PaginationQueryDto) {
    const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const where = { walletId };
    const [totalItems, list] = await this.prisma.$transaction([
      this.prisma.walletTransaction.count({ where }),
      this.prisma.walletTransaction.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    const totalPages = Math.ceil(totalItems / q.pageSize);
    return {
      data: list,
      meta: {
        page: q.page,
        pageSize: q.pageSize,
        totalItems,
        totalPages,
        hasNext: q.page < totalPages,
        hasPrevious: q.page > 1,
      },
    };
  }

  async listEscrow(q: EscrowQueryDto, req: any) {
    let where: Prisma.BookingWhereInput = {
      status: {
        in: [
          BookingStatus.COMPLETED,
          BookingStatus.CUSTOMER_CANCELLED,
          BookingStatus.COMPANION_CANCELLED,
        ],
      },
      ...this.unreleasedEscrow(),
      escrowReleaseAt: { not: null },
    };
    if (q.cityId) where.cityId = q.cityId;
    where = applyCityScope(where, req);

    const [totalItems, list] = await this.prisma.$transaction([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { escrowReleaseAt: 'asc' },
        include: {
          customer: { select: { id: true, name: true } },
          companion: { select: { id: true, name: true } },
          walletTransactions: true,
        },
      }),
    ]);
    const totalPages = Math.ceil(totalItems / q.pageSize);
    return {
      data: list,
      meta: {
        page: q.page,
        pageSize: q.pageSize,
        totalItems,
        totalPages,
        hasNext: q.page < totalPages,
        hasPrevious: q.page > 1,
      },
    };
  }

  async releaseEscrow(bookingId: string, admin: AuthStaffPayload) {
    // A serializable retry starts with a fresh snapshot after a concurrent release.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await this.prisma.$transaction(
          async (tx) => {
            await tx.$queryRaw`SELECT id FROM "Booking" WHERE id = ${bookingId} FOR UPDATE`;
            const booking = await tx.booking.findUnique({ where: { id: bookingId } });
            if (!booking) throw new NotFoundException('Booking not found');
            if (booking.status !== BookingStatus.COMPLETED) {
              throw new BadRequestException('Only completed bookings can release escrow');
            }
            if (!booking.escrowReleaseAt || booking.escrowReleaseAt > new Date()) {
              throw new BadRequestException('Escrow is not due for release');
            }
            if (!booking.companionId)
              throw new BadRequestException('Booking has no companion assigned');

            const customerWallet = await tx.wallet.findUnique({
              where: { customerId: booking.customerId },
            });
            const companionWallet = await tx.wallet.findUnique({
              where: { companionId: booking.companionId },
            });
            if (!customerWallet) throw new NotFoundException('Customer wallet not found');
            if (!companionWallet) throw new NotFoundException('Companion wallet not found');
            const debit = await tx.walletTransaction.findFirst({
              where: {
                bookingId: booking.id,
                walletId: customerWallet.id,
                category: WalletTransactionCategory.BOOKING_CHARGE,
                transactionType: TransactionType.DEBIT,
                status: TransactionStatus.SUCCESS,
              },
              orderBy: { createdAt: 'asc' },
            });
            if (!debit)
              throw new BadRequestException(
                'No successful booking charge debit found for customer',
              );
            const debitMetadata =
              debit.metadata && typeof debit.metadata === 'object' && !Array.isArray(debit.metadata)
                ? (debit.metadata as Prisma.JsonObject)
                : {};
            const previousCredit = await tx.walletTransaction.findFirst({
              where: {
                bookingId: booking.id,
                transactionType: TransactionType.CREDIT,
                status: TransactionStatus.SUCCESS,
                metadata: { path: ['escrowReleased'], equals: true },
              },
            });
            if (debitMetadata.escrowReleased || previousCredit) {
              throw new BadRequestException('Escrow already released for this booking');
            }

            const platformFee = new Prisma.Decimal(booking.platformFeeAmount);
            const companionNet = new Prisma.Decimal(booking.companionNetAmount);
            if (
              platformFee.isNegative() ||
              companionNet.isNegative() ||
              platformFee.plus(companionNet).greaterThan(debit.amount)
            ) {
              throw new BadRequestException(
                'Escrow shares must be non-negative and covered by the original charge',
              );
            }

            // A deterministic ID prevents two initial releases creating two platform wallets.
            let platformWallet = await tx.wallet.findFirst({
              where: { ownerType: 'PLATFORM', currency: customerWallet.currency },
            });
            if (!platformWallet) {
              platformWallet = await tx.wallet.upsert({
                where: { id: 'platform-wallet-' + customerWallet.currency },
                create: {
                  id: 'platform-wallet-' + customerWallet.currency,
                  ownerType: 'PLATFORM',
                  currency: customerWallet.currency,
                },
                update: {},
              });
            }
            if (companionWallet.currency !== customerWallet.currency) {
              throw new BadRequestException('Escrow wallets must use the same currency');
            }

            await tx.walletTransaction.update({
              where: { id: debit.id },
              data: {
                metadata: {
                  ...debitMetadata,
                  escrowReleased: true,
                  releasedBy: admin.sub,
                  releasedAt: new Date().toISOString(),
                },
              },
            });
            const companionUpdated = await tx.wallet.update({
              where: { id: companionWallet.id },
              data: { balance: { increment: companionNet }, ledgerVersion: { increment: 1 } },
            });
            const platformUpdated = await tx.wallet.update({
              where: { id: platformWallet.id },
              data: { balance: { increment: platformFee }, ledgerVersion: { increment: 1 } },
            });
            const metadata = {
              releasedBy: admin.sub,
              releasedByName: admin.name,
              escrowReleased: true,
            };
            const companionCredit = await tx.walletTransaction.create({
              data: {
                walletId: companionWallet.id,
                transactionType: TransactionType.CREDIT,
                category: WalletTransactionCategory.BOOKING_CHARGE,
                amount: companionNet,
                balanceAfter: companionUpdated.balance,
                description:
                  'Escrow release for booking ' + booking.bookingRef + ' - companion share',
                status: TransactionStatus.SUCCESS,
                bookingId: booking.id,
                metadata: { ...metadata, type: 'escrow_release_companion' },
              },
            });
            const platformCredit = await tx.walletTransaction.create({
              data: {
                walletId: platformWallet.id,
                transactionType: TransactionType.CREDIT,
                category: WalletTransactionCategory.PLATFORM_FEE,
                amount: platformFee,
                balanceAfter: platformUpdated.balance,
                description: 'Escrow release for booking ' + booking.bookingRef + ' - platform fee',
                status: TransactionStatus.SUCCESS,
                bookingId: booking.id,
                metadata: { ...metadata, type: 'escrow_release_platform' },
              },
            });
            const updatedBooking = await tx.booking.update({
              where: { id: booking.id },
              data: { escrowReleaseAt: new Date() },
            });
            await tx.companion.update({
              where: { id: booking.companionId },
              data: { totalEarnings: { increment: companionNet } },
            });
            return { companionCredit, platformCredit, booking: updatedBooking };
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        return {
          data: result,
          message: 'Escrow released for booking ' + result.booking.bookingRef,
        };
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034' &&
          attempt < 2
        )
          continue;
        throw error;
      }
    }
    throw new BadRequestException('Escrow release could not be completed');
  }

  async releaseStaleEscrow(admin: AuthStaffPayload) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 2);

    const staleBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.COMPLETED,
        escrowReleaseAt: { lte: cutoffDate, not: null },
        ...this.unreleasedEscrow(),
      },
      include: {
        walletTransactions: {
          where: {
            category: WalletTransactionCategory.BOOKING_CHARGE,
            transactionType: TransactionType.DEBIT,
          },
          take: 1,
        },
      },
      take: 50,
    });

    const results: any[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const booking of staleBookings) {
      try {
        const hasReleased =
          booking.walletTransactions[0]?.metadata &&
          (booking.walletTransactions[0].metadata as any).escrowReleased;
        if (hasReleased) continue;
        if (!booking.companionId) continue;

        await this.releaseEscrow(booking.id, admin);
        results.push({ bookingId: booking.id, status: 'success' });
        successCount++;
      } catch (e) {
        results.push({ bookingId: booking.id, status: 'failed', error: (e as Error).message });
        failCount++;
      }
    }

    return {
      data: {
        processed: staleBookings.length,
        successCount,
        failCount,
        results,
      },
      message: `Stale escrow release complete: ${successCount} succeeded, ${failCount} failed`,
    };
  }
}
