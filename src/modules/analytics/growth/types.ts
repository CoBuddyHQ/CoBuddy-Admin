export interface GrowthStats {
  totalUsers: number;
  newUsersThisMonth: number;
  activeCompanions: number;
  retentionRate: number; // percentage
  chartData: {
    date: string;
    newSignups: number;
    activeUsers: number;
  }[];
}
