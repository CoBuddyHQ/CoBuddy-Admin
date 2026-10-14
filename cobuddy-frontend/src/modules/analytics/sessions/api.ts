import axios from '@/lib/api/client';
import { SessionMetrics } from './types';

export const sessionsApi = {
  getMetrics: async (): Promise<SessionMetrics> => {
    const response = await axios.get('/analytics/sessions');
    return response.data.data;
  },
};
