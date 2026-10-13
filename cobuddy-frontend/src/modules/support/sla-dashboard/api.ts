import axios from '@/lib/api/client';
import { SLAAlert, AgentPerformance } from './types';
export const slaApi = {
  getAlerts: async (): Promise<SLAAlert[]> => {
    return (await axios.get('/support/sla-dashboard/alerts')).data.data;
  },
  getPerformance: async (): Promise<AgentPerformance[]> => {
    return (await axios.get('/support/sla-dashboard/performance')).data.data;
  },
  reassignTicket: async (id: string, staffId: string): Promise<void> => {
    await axios.patch('/support/tickets/' + encodeURIComponent(id) + '/assignment', {
      staffId: staffId || null,
    });
  },
};
