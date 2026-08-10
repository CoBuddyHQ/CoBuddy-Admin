import { RevenueStats } from './types';

const mockData: RevenueStats = {
  totalRevenue: 1250000,
  escrowBalance: 450000,
  availableForPayout: 200000,
  pendingRefunds: 45000,
  netRevenue: 850000,
  payoutLiability: 120000,
  refundRatio: 2.5,
  revenueByCity: [
    { city: 'Mumbai', gmv: 1500000, commission: 225000 },
    { city: 'Delhi', gmv: 800000, commission: 120000 },
    { city: 'Bangalore', gmv: 1200000, commission: 180000 },
  ],
  chartData: [
    { date: '2026-07-01', grossBookingValue: 45000, platformFee: 6750, taxes: 1215, city: 'Mumbai' },
    { date: '2026-07-02', grossBookingValue: 52000, platformFee: 7800, taxes: 1404, city: 'Delhi' },
    { date: '2026-07-03', grossBookingValue: 48000, platformFee: 7200, taxes: 1296, city: 'Bangalore' },
    { date: '2026-07-04', grossBookingValue: 61000, platformFee: 9150, taxes: 1647, city: 'Mumbai' },
    { date: '2026-07-05', grossBookingValue: 59000, platformFee: 8850, taxes: 1593, city: 'Delhi' },
    { date: '2026-07-06', grossBookingValue: 65000, platformFee: 9750, taxes: 1755, city: 'Bangalore' },
    { date: '2026-07-07', grossBookingValue: 71000, platformFee: 10650, taxes: 1917, city: 'Mumbai' },
  ]
};

export const revenueApi = {
  getStats: async (): Promise<RevenueStats> => Promise.resolve(mockData),
};
