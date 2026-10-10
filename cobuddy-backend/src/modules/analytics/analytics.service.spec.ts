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

  it('propagates database failures instead of presenting an empty dashboard', async () => {
    const prisma = {
      customer: { count: jest.fn().mockRejectedValue(new Error('offline')) },
      companion: { count: jest.fn().mockResolvedValue(0) },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };
    await expect(new AnalyticsService(prisma as any).growth(user)).rejects.toThrow('offline');
  });
});
