import axios from '@/lib/api/client';
import { GrowthStats } from './types';

export const growthApi = {
  getStats: async (): Promise<GrowthStats> => {
    const response = await axios.get('/analytics/growth');
    return response.data.data;
  },
};
