import { GrowthStats } from './types';

const mockData: GrowthStats = {
  totalUsers: 45000,
  newUsersThisMonth: 3200,
  activeCompanions: 850,
  retentionRate: 68.5,
  chartData: [
    { date: '2026-08-01', newSignups: 100, activeUsers: 5000 },
    { date: '2026-08-02', newSignups: 120, activeUsers: 5200 },
    { date: '2026-08-03', newSignups: 90, activeUsers: 5100 },
    { date: '2026-08-04', newSignups: 150, activeUsers: 5600 },
    { date: '2026-08-05', newSignups: 200, activeUsers: 6000 },
  ]
};

export const growthApi = {
  getStats: async (): Promise<GrowthStats> => Promise.resolve(mockData),
};
