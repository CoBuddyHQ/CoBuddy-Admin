import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.module';
import {
  RefundStatus,
  Prisma,
  TransactionType,
  WalletTransactionCategory,
  TransactionStatus,
} from '@prisma/client';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import {
  ListRefundsDto,
  ApproveRefundDto,
  RejectRefundDto,
  BookingSettingsDto,
} from './dto/refunds.dto';

@Injectable()
export class RefundsService {
  constructor(private prisma: PrismaService) {}

  async getBookingSettings() {
    const config = await this.prisma.appConfig.findUnique({
      where: { configKey: 'booking_policy' },
    });
    return {
      data: config?.value ?? {
        minBookingDurationMins: 60,
        maxBookingDurationMins: 480,
        cancellationGracePeriodMins: 30,
        autoCancelUnacceptedMins: 15,
        cancellationRefundTiers: [
          { id: 't1', noticeHoursMin: 48, noticeHoursMax: null, refundPercent: 100 },
          { id: 't2', noticeHoursMin: 24, noticeHoursMax: 48, refundPercent: 50 },
          { id: 't3', noticeHoursMin: 0, noticeHoursMax: 24, refundPercent: 0 },
        ],
      },
    };
  }

  async updateBookingSettings(dto: BookingSettingsDto) {
    const value = JSON.parse(JSON.stringify(dto));
    await this.prisma.appConfig.upsert({
      where: { configKey: 'booking_policy' },
      create: {
        configKey: 'booking_policy',
        value,
        description: 'Booking duration and cancellation refund policy',
      },
      update: { value },
    });
    return { data: value, message: 'Booking policies updated' };
  }

  async list(dto: ListRefundsDto) {
    const { page, pageSize, status, bookingId, from, to } = dto;
    const skip = (page - 1) * pageSize;

    const where: Prisma.RefundWhereInput = {};
    if (status) where.status = status as RefundStatus;
    if (bookingId) where.bookingId = bookingId;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as any).gte = new Date(from);
      if (to) (where.createdAt as any).lte = new Date(to);
    }

    const [items, total] = await Promise.all([
      this.prisma.refund.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      this.prisma.refund.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page < Math.ceil(total / pageSize),
        hasPrevious: page > 1,
      },
    };
  }

  async getOne(id: string) {
    const refund = await this.prisma.refund.findUnique({ where: { id } });
    if (!refund) throw new NotFoundException('Refund not found');

    const booking = await this.prisma.booking.findUnique({
      where: { id: refund.bookingId },
      include: {
        customer: { select: { id: true, name: true } },
        companion: { select: { id: true, name: true } },
      },
    });

    return { data: { ...refund, booking } };
  }

  async approve(id: string, _dto: ApproveRefundDto, user: AuthStaffPayload) {
    const refund = await this.prisma.refund.findUnique({ where: { id } });
    if (!refund) throw new NotFoundException('Refund not found');
    if (refund.status !== RefundStatus.REQUESTED)
      throw new BadRequestException('Refund is not in REQUESTED state');

    const claim = await this.prisma.refund.updateMany({
      where: { id, status: RefundStatus.REQUESTED },
      data: { status: RefundStatus.APPROVED, approvedById: user.sub },
    });
    if (claim.count !== 1)
      throw new BadRequestException('Refund state changed; reload before approving');
    return {
      data: await this.prisma.refund.findUnique({ where: { id } }),
      message: 'Refund approved',
    };
  }

  async process(id: string, user: AuthStaffPayload) {
    const refund = await this.prisma.refund.findUnique({ where: { id } });
    if (!refund) throw new NotFoundException('Refund not found');
    if (refund.status !== RefundStatus.APPROVED)
      throw new BadRequestException('Refund must be approved before processing');

    const booking = await this.prisma.booking.findUnique({ where: { id: refund.bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const customerWallet = await this.prisma.wallet.findFirst({
      where: { customerId: booking.customerId },
    });
    if (!customerWallet) throw new NotFoundException('Customer wallet not found');

    const result = await this.prisma.$transaction(async (tx) => {
      // A conditional update locks and claims this refund once, even across concurrent workers.
      const claim = await tx.refund.updateMany({
        where: { id, status: RefundStatus.APPROVED },
        data: { status: RefundStatus.PROCESSED, processedAt: new Date() },
      });
      if (claim.count !== 1)
        throw new BadRequestException('Refund already processed or state changed');

      const refundAmount = new Prisma.Decimal(refund.amount);
      if (refundAmount.lte(0)) throw new BadRequestException('Refund amount must be positive');
      const wallet = await tx.wallet.update({
        where: { id: customerWallet.id },
        data: {
          balance: { increment: refundAmount },
          ledgerVersion: { increment: 1 },
          lastTopupAt: new Date(),
        },
      });

      const txn = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          transactionType: TransactionType.CREDIT,
          category: WalletTransactionCategory.BOOKING_REFUND,
          amount: refundAmount,
          balanceAfter: wallet.balance,
          description: `Refund for booking ${booking.bookingRef}`,
          status: TransactionStatus.SUCCESS,
          bookingId: booking.id,
          refundId: id,
          metadata: { processedBy: user.sub, processedByName: user.name },
        },
      });

      await tx.customer.update({
        where: { id: booking.customerId },
        data: { walletBalance: wallet.balance },
      });
      const updated = await tx.refund.findUnique({ where: { id } });

      return { refund: updated, transaction: txn };
    });

    return { data: result, message: 'Refund processed and credited to customer wallet' };
  }

  async reject(id: string, dto: RejectRefundDto, _user: AuthStaffPayload) {
    const refund = await this.prisma.refund.findUnique({ where: { id } });
    if (!refund) throw new NotFoundException('Refund not found');
    if (refund.status === RefundStatus.PROCESSED)
      throw new BadRequestException('Cannot reject a processed refund');

    const claim = await this.prisma.refund.updateMany({
      where: { id, status: { in: [RefundStatus.REQUESTED, RefundStatus.APPROVED] } },
      data: { status: RefundStatus.REJECTED, reason: dto.reason },
    });
    if (claim.count !== 1)
      throw new BadRequestException('Refund cannot be rejected in its current state');
    return {
      data: await this.prisma.refund.findUnique({ where: { id } }),
      message: 'Refund rejected',
    };
  }

  async summary() {
    const [requested, approved, processed, rejected] = await Promise.all([
      this.prisma.refund.aggregate({
        where: { status: RefundStatus.REQUESTED },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.refund.aggregate({
        where: { status: RefundStatus.APPROVED },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.refund.aggregate({
        where: { status: RefundStatus.PROCESSED },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.refund.aggregate({
        where: { status: RefundStatus.REJECTED },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      data: {
        requested: { count: requested._count, amount: requested._sum.amount ?? 0 },
        approved: { count: approved._count, amount: approved._sum.amount ?? 0 },
        processed: { count: processed._count, amount: processed._sum.amount ?? 0 },
        rejected: { count: rejected._count, amount: rejected._sum.amount ?? 0 },
      },
    };
  }
}
