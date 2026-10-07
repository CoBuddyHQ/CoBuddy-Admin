import { unavailableFeature } from '@/lib/unavailable-feature';
import { GrowthAbuseAlert } from './types';
export const growthAbuseApi = {
  getAlerts: async (): Promise<GrowthAbuseAlert[]> => {
    return unavailableFeature('operations/growth-abuse');
  },
  updateStatus: async (_id: string, _status: GrowthAbuseAlert['status']): Promise<void> => {
    return unavailableFeature('operations/growth-abuse');
  },
  takeAction: async (_id: string, _action: 'BLOCK_REFERRAL' | 'BAN_ACCOUNTS'): Promise<void> => {
    return unavailableFeature('operations/growth-abuse');
  },
};
