import { Injectable } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { PrismaService } from '@/prisma/prisma.module';
import { cityWhere } from '@/common/auth/city-scope';

const cancelled: BookingStatus[] = [
  'CUSTOMER_CANCELLED',
  'COMPANION_CANCELLED',
  'ADMIN_CANCELLED',
  'REJECTED_BY_COMPANION',
  'NO_SHOW_CUSTOMER',
  'NO_SHOW_COMPANION',
  'COMPANION_EARLY_END',
];

export function analyticsCityScope(user: AuthStaffPayload) {
  return cityWhere(user);
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private async safetyOwnerFilters(user: AuthStaffPayload) {
    const scope = analyticsCityScope(user);
    if (!scope.cityId) return null;

    const [customers, companions] = await Promise.all([
      this.prisma.customer.findMany({
        where: { cityId: scope.cityId },
        select: { id: true },
      }),
      this.prisma.companion.findMany({
        where: { cityId: scope.cityId },
        select: { id: true },
      }),
    ]);

    return [
      { userType: 'CUSTOMER', userId: { in: customers.map(({ id }) => id) } },
      { userType: 'COMPANION', userId: { in: companions.map(({ id }) => id) } },
    ];
  }

  private sqlScope(user: AuthStaffPayload): Prisma.Sql {
    const scope = analyticsCityScope(user);
    if (!scope.cityId) return Prisma.sql`TRUE`;
    return scope.cityId.in.length
      ? Prisma.sql`"cityId" IN (${Prisma.join(scope.cityId.in)})`
      : Prisma.sql`FALSE`;
  }

  async growth(user: AuthStaffPayload) {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const scope = analyticsCityScope(user);
    const [totalUsers, newUsersThisMonth, activeCompanions, chartData] = await Promise.all([
      this.prisma.customer.count({ where: scope }),
      this.prisma.customer.count({ where: { ...scope, createdAt: { gte: monthStart, lte: now } } }),
      this.prisma.companion.count({ where: { ...scope, status: 'ACTIVE' } }),
      this.prisma.$queryRaw<
        { date: string; newSignups: number; bookingCustomers: number }[]
      >(Prisma.sql`
        WITH signups AS (
          SELECT "createdAt"::date AS day, count(*)::int AS total FROM "Customer"
          WHERE ${this.sqlScope(user)} AND "createdAt" >= ${monthStart} AND "createdAt" <= ${now} GROUP BY 1
        ), bookings AS (
          SELECT "startTime"::date AS day, count(DISTINCT "customerId")::int AS total FROM "Booking"
          WHERE ${this.sqlScope(user)} AND "status" = 'COMPLETED' AND "startTime" >= ${monthStart} AND "startTime" <= ${now} GROUP BY 1
        )
        SELECT to_char(days.day, 'YYYY-MM-DD') AS date, COALESCE(signups.total, 0)::int AS "newSignups",
          COALESCE(bookings.total, 0)::int AS "bookingCustomers"
        FROM generate_series(${monthStart}::timestamp, ${today}::timestamp, interval '1 day') AS days(day)
        LEFT JOIN signups ON signups.day = days.day::date LEFT JOIN bookings ON bookings.day = days.day::date ORDER BY days.day
      `),
    ]);
    return {
      data: {
        totalUsers,
        newUsersThisMonth,
        activeCompanions,
        chartData,
        timezone: 'UTC',
        measuredAt: now.toISOString(),
      },
    };
  }

  async sessions(user: AuthStaffPayload) {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const end = new Date(start.getTime() + 86400000);
    const where = { ...analyticsCityScope(user), startTime: { gte: start, lt: end } };
    const [totals, statuses, hours] = await Promise.all([
      this.prisma.booking.aggregate({ where, _count: true, _avg: { durationMins: true } }),
      this.prisma.booking.groupBy({ by: ['status'], where, _count: true }),
      this.prisma.$queryRaw<{ hour: number; sessions: number; cancellations: number }[]>(Prisma.sql`
        SELECT extract(hour FROM "startTime")::int AS hour, count(*)::int AS sessions,
          count(*) FILTER (WHERE "status"::text IN (${Prisma.join(cancelled)}))::int AS cancellations
        FROM "Booking" WHERE ${this.sqlScope(user)} AND "startTime" >= ${start} AND "startTime" < ${end} GROUP BY 1 ORDER BY 1
      `),
    ]);
    const cancellationCount = statuses
      .filter((row) => cancelled.includes(row.status))
      .reduce((sum, row) => sum + row._count, 0);
    return {
      data: {
        totalSessionsToday: totals._count,
        avgDurationMinutes:
          totals._avg.durationMins === null ? null : Number(totals._avg.durationMins.toFixed(1)),
        cancellationRate: totals._count
          ? Number(((cancellationCount / totals._count) * 100).toFixed(1))
          : null,
        statuses: statuses.map((row) => ({ status: row.status, count: row._count })),
        chartData: Array.from({ length: 24 }, (_, hour) => ({
          hour: `${hour.toString().padStart(2, '0')}:00`,
          sessions: hours.find((row) => row.hour === hour)?.sessions ?? 0,
          cancellations: hours.find((row) => row.hour === hour)?.cancellations ?? 0,
        })),
        timezone: 'UTC',
        measuredAt: now.toISOString(),
      },
    };
  }

  async safety(user: AuthStaffPayload) {
    const measuredAt = new Date();
    const ownerFilters = await this.safetyOwnerFilters(user);
    const ownerScope = ownerFilters ? { OR: ownerFilters } : {};
    const activeBanWhere = {
      AND: [
        ...(ownerFilters ? [{ OR: ownerFilters }] : []),
        { startsAt: { lte: measuredAt } },
        { liftedAt: null },
        { OR: [{ endsAt: null }, { endsAt: { gt: measuredAt } }] },
      ],
    };

    const [activeBans, fraudFlags, ageEscalations] = await Promise.all([
      this.prisma.userBan.groupBy({
        by: ['userId', 'userType'],
        where: activeBanWhere,
        _count: { _all: true },
      }),
      this.prisma.fraudFlag.groupBy({
        by: ['category'],
        where: ownerScope,
        _count: { _all: true },
      }),
      this.prisma.minorAgeEscalation.groupBy({
        by: ['status'],
        where: ownerScope,
        _count: { _all: true },
      }),
    ]);

    const activeBanCount = activeBans.reduce((total, row) => total + row._count._all, 0);
    const repeatOffenderCount = activeBans.filter((row) => row._count._all > 1).length;
    const fraudHits = fraudFlags.reduce((total, row) => total + row._count._all, 0);
    const spoofHits = fraudFlags
      .filter((row) => ['GPS_SPOOFING', 'FAKE_SELFIE'].includes(row.category))
      .reduce((total, row) => total + row._count._all, 0);
    const totalAgeEscalations = ageEscalations.reduce((total, row) => total + row._count._all, 0);
    const resolvedAgeEscalations = ageEscalations
      .filter((row) => ['APPROVED', 'REJECTED'].includes(row.status))
      .reduce((total, row) => total + row._count._all, 0);

    return {
      data: {
        activeRestrictions: activeBanCount,
        repeatOffenders: repeatOffenderCount,
        repeatOffenderRate: activeBans.length
          ? Number(((repeatOffenderCount / activeBans.length) * 100).toFixed(1))
          : 0,
        fraudHits,
        spoofHits,
        totalAgeEscalations,
        resolvedAgeEscalations,
        ageResolutionRate: totalAgeEscalations
          ? Number(((resolvedAgeEscalations / totalAgeEscalations) * 100).toFixed(1))
          : 0,
        measuredAt: measuredAt.toISOString(),
      },
    };
  }

  async market(user: AuthStaffPayload) {
    const scope = analyticsCityScope(user);
    const now = new Date();
    const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const previousMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const [cities, bookings, fees, companions, current, previous] = await Promise.all([
      this.prisma.city.findMany({
        where: scope.cityId ? { id: scope.cityId } : {},
        select: { id: true, name: true },
        orderBy: { cityCode: 'asc' },
      }),
      this.prisma.booking.groupBy({ by: ['cityId'], where: scope, _count: true }),
      this.prisma.booking.groupBy({
        by: ['cityId'],
        where: { ...scope, status: 'COMPLETED', paymentStatus: 'PAID' },
        _sum: { platformFeeAmount: true },
      }),
      this.prisma.companion.groupBy({
        by: ['cityId'],
        where: { ...scope, status: 'ACTIVE' },
        _count: true,
      }),
      this.prisma.booking.groupBy({
        by: ['cityId'],
        where: { ...scope, createdAt: { gte: month, lte: now } },
        _count: true,
      }),
      this.prisma.booking.groupBy({
        by: ['cityId'],
        where: { ...scope, createdAt: { gte: previousMonth, lt: month } },
        _count: true,
      }),
    ]);
    return {
      data: cities.map((city) => {
        const prior = previous.find((row) => row.cityId === city.id)?._count ?? 0;
        const recent = current.find((row) => row.cityId === city.id)?._count ?? 0;
        const name = city.name as Record<string, string>;
        return {
          cityId: city.id,
          cityName: name.en ?? city.id,
          totalBookings: bookings.find((row) => row.cityId === city.id)?._count ?? 0,
          activeCompanions: companions.find((row) => row.cityId === city.id)?._count ?? 0,
          revenueGenerated: Number(
            fees.find((row) => row.cityId === city.id)?._sum.platformFeeAmount ?? 0,
          ),
          growthRate: prior ? Number((((recent - prior) / prior) * 100).toFixed(1)) : null,
        };
      }),
    };
  }
}
