export interface GrowthStats {
  totalUsers: number;
  newUsersThisMonth: number;
  activeCompanions: number;
  chartData: {
    date: string;
    newSignups: number;
    bookingCustomers: number;
  }[];
}
