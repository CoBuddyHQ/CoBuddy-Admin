import { CityPerformance } from './types';

const mockData: CityPerformance[] = [
  { cityName: 'Mumbai', totalBookings: 15200, activeCompanions: 350, revenueGenerated: 5500000, growthRate: 12.5 },
  { cityName: 'Delhi', totalBookings: 12400, activeCompanions: 280, revenueGenerated: 4200000, growthRate: 8.2 },
  { cityName: 'Bangalore', totalBookings: 9800, activeCompanions: 210, revenueGenerated: 3100000, growthRate: 15.4 },
];

export const marketApi = {
  getPerformance: async (): Promise<CityPerformance[]> => Promise.resolve(mockData),
};
