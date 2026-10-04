import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.module';
import { InvoiceStatus, RefundStatus, BookingStatus } from '@prisma/client';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

@Injectable()
export class RevenueReportsService {
  constructor(private prisma: PrismaService) {}

  async overview() {
    const [totalRevenue, totalPayouts, totalRefunds, totalBookings] = await Promise.all([
      this.prisma.taxInvoice.aggregate({
        where: { status: InvoiceStatus.PAID },
        _sum: { totalAmount: true },
      }),
      this.prisma.payout.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      this.prisma.refund.aggregate({
        where: { status: RefundStatus.PROCESSED },
        _sum: { amount: true },
      }),
      this.prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
    ]);

    const platformRevenue =
      Number(totalRevenue._sum.totalAmount ?? 0) - Number(totalPayouts._sum.amount ?? 0);

    return {
      data: {
        grossRevenue: totalRevenue._sum.totalAmount ?? 0,
        totalPayouts: totalPayouts._sum.amount ?? 0,
        totalRefunds: totalRefunds._sum.amount ?? 0,
        platformRevenue,
        completedBookings: totalBookings,
      },
    };
  }

  async daily(from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.COMPLETED,
        createdAt: { gte: fromDate, lte: toDate },
      },
      select: {
        createdAt: true,
        bookingAmount: true,
        platformFeeAmount: true,
        companionNetAmount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const byDay: Record<
      string,
      { date: string; bookings: number; gross: number; platformFee: number; companionNet: number }
    > = {};

    bookings.forEach((b) => {
      const day = b.createdAt.toISOString().slice(0, 10);
      if (!byDay[day])
        byDay[day] = { date: day, bookings: 0, gross: 0, platformFee: 0, companionNet: 0 };
      byDay[day].bookings++;
      byDay[day].gross += Number(b.bookingAmount);
      byDay[day].platformFee += Number(b.platformFeeAmount);
      byDay[day].companionNet += Number(b.companionNetAmount);
    });

    return { data: Object.values(byDay) };
  }

  async byCity(from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const result = await this.prisma.booking.groupBy({
      by: ['cityId'],
      where: { status: BookingStatus.COMPLETED, createdAt: { gte: fromDate, lte: toDate } },
      _count: true,
      _sum: { bookingAmount: true, platformFeeAmount: true, companionNetAmount: true },
      orderBy: { _sum: { bookingAmount: 'desc' } },
    });

    const cityIds = result.map((r) => r.cityId);
    const cities = await this.prisma.city.findMany({
      where: { id: { in: cityIds } },
      select: { id: true, name: true },
    });
    const cityMap = Object.fromEntries(cities.map((c) => [c.id, c.name]));

    return {
      data: result.map((r) => ({
        cityId: r.cityId,
        cityName: cityMap[r.cityId] ?? r.cityId,
        bookings: r._count,
        gross: r._sum.bookingAmount ?? 0,
        platformFee: r._sum.platformFeeAmount ?? 0,
        companionNet: r._sum.companionNetAmount ?? 0,
      })),
    };
  }

  async topCompanions(q: PaginationQueryDto) {
    const companions = await this.prisma.companion.findMany({
      orderBy: { totalEarnings: 'desc' },
      take: q.pageSize,
      skip: (q.page - 1) * q.pageSize,
      select: {
        id: true,
        name: true,
        totalEarnings: true,
        totalSessions: true,
        trustScore: true,
        cityId: true,
      },
    });
    return { data: companions };
  }
}
