import axios from '@/lib/api/client';
import { GrowthAbuseAlert } from './types';
export const growthAbuseApi = {
  getAlerts: async (): Promise<GrowthAbuseAlert[]> => {
    return (await axios.get('/operations/growth-abuse')).data.data;
  },
  updateStatus: async (id: string, status: GrowthAbuseAlert['status']): Promise<void> => {
    await axios.patch('/operations/growth-abuse/' + encodeURIComponent(id) + '/status', { status });
  },
  takeAction: async (id: string, action: 'BLOCK_REFERRAL' | 'BAN_ACCOUNTS'): Promise<void> => {
    await axios.post('/operations/growth-abuse/' + encodeURIComponent(id) + '/actions', { action });
  },
};
