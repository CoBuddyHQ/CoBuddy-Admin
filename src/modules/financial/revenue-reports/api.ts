import axios from '@/lib/api/client';
import { RevenueStats } from './types';

const unwrap = (response: any) => response.data.data?.data ?? response.data.data;
const today = new Date();
const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
const to = today.toISOString();

export const revenueApi = {
  getStats: async (): Promise<RevenueStats> => {
    const [overviewRes, citiesRes, dailyRes, payoutsRes, refundsRes] = await Promise.all([
      axios.get('/financial/revenue-reports/overview'),
      axios.get('/financial/revenue-reports/by-city', { params: { from, to } }),
      axios.get('/financial/revenue-reports/daily', { params: { from, to } }),
      axios.get('/financial/payouts/summary'),
      axios.get('/financial/refunds/summary'),
    ]);
    const overview = unwrap(overviewRes);
    const cityRows = unwrap(citiesRes) ?? [];
    const dailyRows = unwrap(dailyRes) ?? [];
    const payoutSummary = unwrap(payoutsRes) ?? {};
    const refundSummary = unwrap(refundsRes);
    const pendingRefunds =
      Number(refundSummary?.requested?.amount ?? 0) + Number(refundSummary?.approved?.amount ?? 0);
    const gross = Number(overview?.grossRevenue ?? 0);
    const pendingPayouts =
      Number(payoutSummary.pending?.amount ?? 0) + Number(payoutSummary.onHold?.amount ?? 0);

    return {
      totalRevenue: gross,
      escrowBalance: 0,
      availableForPayout: Number(payoutSummary.pending?.amount ?? 0),
      pendingRefunds,
      netRevenue: Number(overview?.platformRevenue ?? 0),
      payoutLiability: pendingPayouts,
      refundRatio: gross > 0 ? (pendingRefunds / gross) * 100 : 0,
      revenueByCity: cityRows.map((city: any) => ({
        city:
          typeof city.cityName === 'string' ? city.cityName : (city.cityName?.en ?? city.cityId),
        gmv: Number(city.gross ?? 0),
        commission: Number(city.platformFee ?? 0),
      })),
      chartData: dailyRows.map((entry: any) => ({
        date: entry.date,
        grossBookingValue: Number(entry.gross ?? 0),
        platformFee: Number(entry.platformFee ?? 0),
        taxes: 0,
      })),
    };
  },
};
