import { RevenueStats } from './types';

const mockData: RevenueStats = {
  totalRevenue: 1250000,
  escrowBalance: 450000,
  availableForPayout: 200000,
  pendingRefunds: 15000,
  chartData: [
    { date: '2026-08-01', grossBookingValue: 50000, platformFee: 5000, taxes: 900 },
    { date: '2026-08-02', grossBookingValue: 55000, platformFee: 5500, taxes: 990 },
    { date: '2026-08-03', grossBookingValue: 48000, platformFee: 4800, taxes: 864 },
    { date: '2026-08-04', grossBookingValue: 62000, platformFee: 6200, taxes: 1116 },
    { date: '2026-08-05', grossBookingValue: 70000, platformFee: 7000, taxes: 1260 },
  ]
};

export const revenueApi = {
  getStats: async (): Promise<RevenueStats> => Promise.resolve(mockData),
};
