export interface CityPerformance {
  cityId: string;
  cityName: string;
  totalBookings: number;
  activeCompanions: number;
  revenueGenerated: number;
  growthRate: number | null;
}
