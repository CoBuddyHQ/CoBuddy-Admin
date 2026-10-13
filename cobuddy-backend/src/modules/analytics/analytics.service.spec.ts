import { analyticsCityScope, AnalyticsService } from './analytics.service';

describe('Database-backed analytics', () => {
  const user = { roles: ['CITY_OPS_MANAGER'], cityScopeIds: ['city-a'] } as any;
  it('restricts mixed-role city staff and fails closed for an empty scope', () => {
    expect(analyticsCityScope({ ...user, roles: ['CITY_OPS_MANAGER', 'FINANCE_ADMIN'] })).toEqual({
      cityId: { in: ['city-a'] },
    });
    expect(analyticsCityScope({ ...user, cityScopeIds: [] })).toEqual({ cityId: { in: [] } });
    expect(analyticsCityScope({ ...user, roles: ['SUPER_ADMIN', 'CITY_OPS_MANAGER'] })).toEqual({});
  });

  it.each(['SAFETY_OPERATOR', 'MODERATOR', 'SUPPORT_AGENT', 'SUPPORT_LEAD', 'FINANCE_ADMIN'])(
    'applies assigned city restrictions to %s without a city-manager role',
    (role) => {
      expect(analyticsCityScope({ ...user, roles: [role] })).toEqual({
        cityId: { in: ['city-a'] },
      });
      expect(analyticsCityScope({ ...user, roles: [role], cityScopeIds: [] })).toEqual({});
    },
  );

  it('uses full database counts instead of a paginated customer list and applies scope to SQL', async () => {
    const prisma = {
      customer: { count: jest.fn().mockResolvedValueOnce(91).mockResolvedValueOnce(4) },
      companion: { count: jest.fn().mockResolvedValue(12) },
      $queryRaw: jest
        .fn()
        .mockResolvedValue([{ date: '2026-10-01', newSignups: 4, bookingCustomers: 3 }]),
    };
    const result = await new AnalyticsService(prisma as any).growth(user);
    expect(result.data.totalUsers).toBe(91);
    expect(result.data.newUsersThisMonth).toBe(4);
    expect(result.data.activeCompanions).toBe(12);
    expect(prisma.customer.count.mock.calls[0][0].where).toEqual({ cityId: { in: ['city-a'] } });
    expect(prisma.$queryRaw.mock.calls[0][0].values).toContain('city-a');
    expect(result.data).not.toHaveProperty('retentionRate');
  });

  it('reports undefined rates as null and derives hourly zeroes only from an empty query', async () => {
    const prisma = {
      booking: {
        aggregate: jest.fn().mockResolvedValue({ _count: 0, _avg: { durationMins: null } }),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };
    const result = await new AnalyticsService(prisma as any).sessions(user);
    expect(result.data.totalSessionsToday).toBe(0);
    expect(result.data.avgDurationMinutes).toBeNull();
    expect(result.data.cancellationRate).toBeNull();
    expect(result.data.chartData).toHaveLength(24);
    expect(result.data.chartData.every((row) => row.sessions === 0)).toBe(true);
  });

  it('calculates safety metrics from complete grouped database results', async () => {
    const prisma = {
      userBan: {
        groupBy: jest.fn().mockResolvedValue([
          { userId: 'customer-1', userType: 'CUSTOMER', _count: { _all: 2 } },
          { userId: 'customer-2', userType: 'CUSTOMER', _count: { _all: 1 } },
        ]),
      },
      fraudFlag: {
        groupBy: jest.fn().mockResolvedValue([
          { category: 'GPS_SPOOFING', _count: { _all: 2 } },
          { category: 'PAYMENT_FRAUD', _count: { _all: 1 } },
        ]),
      },
      minorAgeEscalation: {
        groupBy: jest.fn().mockResolvedValue([
          { status: 'APPROVED', _count: { _all: 1 } },
          { status: 'PENDING', _count: { _all: 2 } },
        ]),
      },
    };

    const result = await new AnalyticsService(prisma as any).safety({
      roles: ['SUPER_ADMIN'],
      cityScopeIds: [],
    } as any);

    expect(result.data).toMatchObject({
      activeRestrictions: 3,
      repeatOffenders: 1,
      repeatOffenderRate: 50,
      fraudHits: 3,
      spoofHits: 2,
      totalAgeEscalations: 3,
      resolvedAgeEscalations: 1,
      ageResolutionRate: 33.3,
    });
    expect(prisma.userBan.groupBy.mock.calls[0][0].where.AND).toContainEqual({ liftedAt: null });
    expect(prisma.userBan.groupBy.mock.calls[0][0].where.AND).toContainEqual({
      startsAt: expect.objectContaining({ lte: expect.any(Date) }),
    });
    expect(prisma.fraudFlag.groupBy.mock.calls[0][0].where).toEqual({});
  });

  it.each(['CITY_OPS_MANAGER', 'SAFETY_OPERATOR', 'MODERATOR'])(
    'limits safety aggregates for scoped %s staff',
    async (role) => {
      const prisma = {
        customer: { findMany: jest.fn().mockResolvedValue([{ id: 'customer-a' }]) },
        companion: { findMany: jest.fn().mockResolvedValue([{ id: 'companion-a' }]) },
        userBan: { groupBy: jest.fn().mockResolvedValue([]) },
        fraudFlag: { groupBy: jest.fn().mockResolvedValue([]) },
        minorAgeEscalation: { groupBy: jest.fn().mockResolvedValue([]) },
      };

      await new AnalyticsService(prisma as any).safety({ ...user, roles: [role] });

      expect(prisma.userBan.groupBy.mock.calls[0][0].where.AND).toContainEqual({
        OR: [
          { userType: 'CUSTOMER', userId: { in: ['customer-a'] } },
          { userType: 'COMPANION', userId: { in: ['companion-a'] } },
        ],
      });
      expect(prisma.fraudFlag.groupBy.mock.calls[0][0].where.OR[0].userId.in).toEqual([
        'customer-a',
      ]);
      expect(prisma.minorAgeEscalation.groupBy.mock.calls[0][0].where.OR[1].userId.in).toEqual([
        'companion-a',
      ]);
    },
  );

  it('propagates database failures instead of presenting an empty dashboard', async () => {
    const prisma = {
      customer: { count: jest.fn().mockRejectedValue(new Error('offline')) },
      companion: { count: jest.fn().mockResolvedValue(0) },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };
    await expect(new AnalyticsService(prisma as any).growth(user)).rejects.toThrow('offline');
  });
});
