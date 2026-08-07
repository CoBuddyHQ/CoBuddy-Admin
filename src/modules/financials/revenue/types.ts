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
  }[];
}
