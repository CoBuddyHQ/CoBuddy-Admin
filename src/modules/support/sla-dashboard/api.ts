import { unavailableFeature } from '@/lib/unavailable-feature';
import { SLAAlert, AgentPerformance } from './types';
export const slaApi = {
  getAlerts: async (): Promise<SLAAlert[]> => {
    return unavailableFeature('support/sla-dashboard');
  },
  getPerformance: async (): Promise<AgentPerformance[]> => {
    return unavailableFeature('support/sla-dashboard');
  },
  reassignTicket: async (_ticketId: string, _newAgentName: string): Promise<void> => {
    return unavailableFeature('support/sla-dashboard');
  },
};
