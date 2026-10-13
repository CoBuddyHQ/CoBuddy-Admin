import axios from '@/lib/api/client';
import { SafetyAnalytics } from './types';

export const safetyAnalyticsApi = {
  getMetrics: async (): Promise<SafetyAnalytics> => {
    const response = await axios.get<{ data: SafetyAnalytics }>('/analytics/safety');
    return response.data.data;
  },
};
