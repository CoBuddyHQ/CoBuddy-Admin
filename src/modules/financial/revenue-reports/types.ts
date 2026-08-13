export interface RevenueStats {
  totalRevenue: number;
  escrowBalance: number;
  availableForPayout: number;
  pendingRefunds: number;
  chartData: {
    date: string;
    grossBookingValue: number;
    platformFee: number;
    taxes: number;
    city?: string;
  }[];
  revenueByCity: { city: string; gmv: number; commission: number }[];
  netRevenue: number;
  payoutLiability: number;
  refundRatio: number;
}
