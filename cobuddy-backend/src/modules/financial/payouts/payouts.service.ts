import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.module';
import { PayoutStatus, Prisma } from '@prisma/client';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { ListPayoutsDto, HoldPayoutDto, ProcessPayoutDto, MarkPaidDto } from './dto/payouts.dto';

@Injectable()
export class PayoutsService {
  constructor(private prisma: PrismaService) {}

  async list(dto: ListPayoutsDto) {
    const { page, pageSize, companionId, status, from, to } = dto;
    const skip = (page - 1) * pageSize;

    const where: Prisma.PayoutWhereInput = {};
    if (companionId) where.companionId = companionId;
    if (status) where.status = status as PayoutStatus;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as any).gte = new Date(from);
      if (to) (where.createdAt as any).lte = new Date(to);
    }

    const [items, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          companion: { select: { id: true, name: true, phone: true } },
          bankAccount: {
            select: { id: true, accountLast4: true, ifscCode: true, upiId: true, verified: true },
          },
        },
      }),
      this.prisma.payout.count({ where }),
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
    const payout = await this.prisma.payout.findUnique({
      where: { id },
      include: {
        companion: { select: { id: true, name: true, phone: true, email: true } },
        bankAccount: {
          select: { id: true, accountLast4: true, ifscCode: true, upiId: true, verified: true },
        },
        walletTransactions: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!payout) throw new NotFoundException('Payout not found');
    return { data: payout };
  }

  async hold(id: string, dto: HoldPayoutDto, _user: AuthStaffPayload) {
    const updated = await this.transition(id, [PayoutStatus.PENDING, PayoutStatus.FAILED], {
      status: PayoutStatus.ON_HOLD,
      holdReason: dto.reason,
    });
    return { data: updated, message: 'Payout placed on hold' };
  }

  async process(id: string, dto: ProcessPayoutDto, user: AuthStaffPayload) {
    const updated = await this.transition(
      id,
      [PayoutStatus.PENDING, PayoutStatus.FAILED],
      {
        status: PayoutStatus.PROCESSING,
        utrNumber: dto.utrNumber ?? null,
        gatewayPayoutId: dto.gatewayPayoutId ?? null,
        paidByAdminId: user.sub,
        failureMessage: null,
        holdReason: null,
        processedAt: null,
      },
      true,
    );
    return { data: updated, message: 'Payout marked as processing' };
  }

  async markPaid(_id: string, _dto: MarkPaidDto, _user: AuthStaffPayload) {
    throw new ServiceUnavailableException(
      'Payout settlement verification is not connected to a payout provider. The payout remains processing.',
    );
  }

  async markFailed(id: string, reason: string, _user: AuthStaffPayload) {
    const updated = await this.transition(id, [PayoutStatus.PROCESSING], {
      status: PayoutStatus.FAILED,
      failureMessage: reason,
    });
    return { data: updated, message: 'Payout marked as failed' };
  }

  async liftHold(id: string, _user: AuthStaffPayload) {
    const updated = await this.transition(id, [PayoutStatus.ON_HOLD], {
      status: PayoutStatus.PENDING,
      holdReason: null,
    });
    return { data: updated, message: 'Hold lifted' };
  }

  private transition(
    id: string,
    allowed: PayoutStatus[],
    data: Prisma.PayoutUpdateManyMutationInput,
    requireVerifiedAccount = false,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({ where: { id } });
      if (!payout) throw new NotFoundException('Payout not found');
      if (!allowed.includes(payout.status))
        throw new BadRequestException('Payout cannot change from its current state');
      if (requireVerifiedAccount && new Prisma.Decimal(payout.amount).lte(0))
        throw new BadRequestException('Payout amount must be positive');

      // Claim the observed version and status so concurrent staff actions cannot overwrite each other.
      const claim = await tx.payout.updateMany({
        where: {
          id,
          status: payout.status,
          updatedAt: payout.updatedAt,
          ...(requireVerifiedAccount
            ? { bankAccount: { is: { verified: true, companionId: payout.companionId } } }
            : {}),
        },
        data,
      });
      if (claim.count !== 1)
        throw new ConflictException(
          'Payout changed or its bank account is unverified. Refresh before retrying.',
        );
      return tx.payout.findUniqueOrThrow({ where: { id } });
    });
  }

  async summary() {
    const [pending, onHold, processing, paid, failed] = await Promise.all([
      this.prisma.payout.aggregate({
        where: { status: PayoutStatus.PENDING },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payout.aggregate({
        where: { status: PayoutStatus.ON_HOLD },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payout.aggregate({
        where: { status: PayoutStatus.PROCESSING },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payout.aggregate({
        where: { status: PayoutStatus.PAID },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payout.aggregate({
        where: { status: PayoutStatus.FAILED },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      data: {
        pending: { count: pending._count, amount: pending._sum.amount ?? 0 },
        onHold: { count: onHold._count, amount: onHold._sum.amount ?? 0 },
        processing: { count: processing._count, amount: processing._sum.amount ?? 0 },
        paid: { count: paid._count, amount: paid._sum.amount ?? 0 },
        failed: { count: failed._count, amount: failed._sum.amount ?? 0 },
      },
    };
  }
}
