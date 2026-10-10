import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.module';

@Injectable()
export class EarningsBreakdownService {
  constructor(private prisma: PrismaService) {}

  async getEarningsBreakdown(companionId: string) {
    const companion = await this.prisma.companion.findUnique({ where: { id: companionId } });
    if (!companion) throw new NotFoundException('Companion not found');

    const wallet = await this.prisma.wallet.findFirst({
      where: { companionId },
      select: { id: true },
    });
    if (!wallet) {
      return {
        data: {
          totalEarnings: 0,
          platformFees: 0,
          netEarnings: 0,
          bookingCount: 0,
          monthlyBreakdown: [],
        },
      };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const bookingCharges = await this.prisma.walletTransaction.aggregate({
      where: {
        walletId: wallet.id,
        category: 'BOOKING_CHARGE',
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
      _count: true,
    });

    const platformFees = await this.prisma.walletTransaction.aggregate({
      where: {
        walletId: wallet.id,
        category: 'PLATFORM_FEE',
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    });

    const payouts = await this.prisma.walletTransaction.aggregate({
      where: {
        walletId: wallet.id,
        category: 'PAYOUT',
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    });

    const monthlyBreakdown: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthEarnings = await this.prisma.walletTransaction.aggregate({
        where: {
          walletId: wallet.id,
          category: 'BOOKING_CHARGE',
          createdAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      });
      monthlyBreakdown.push({
        month: monthStart.toISOString().slice(0, 7),
        earnings: monthEarnings._sum.amount?.toNumber() || 0,
      });
    }

    return {
      data: {
        totalEarnings: bookingCharges._sum.amount?.toNumber() || 0,
        platformFees: platformFees._sum.amount?.toNumber() || 0,
        netEarnings:
          (bookingCharges._sum.amount?.toNumber() || 0) -
          (platformFees._sum.amount?.toNumber() || 0),
        bookingCount: bookingCharges._count,
        paidOut: payouts._sum.amount?.toNumber() || 0,
        currentMonth: startOfMonth.toISOString().slice(0, 7),
        monthlyBreakdown,
      },
    };
  }
}
