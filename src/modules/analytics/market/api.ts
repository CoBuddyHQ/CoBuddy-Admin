import axios from '@/lib/api/client';
import { CityPerformance } from './types';

export const marketApi = {
  getPerformance: async (): Promise<CityPerformance[]> => {
    const response = await axios.get('/analytics/market');
    return response.data.data;
  },
};
