import { unavailableFeature } from '@/lib/unavailable-feature';
import { PrivacyRequest } from './types';
export const privacyApi = {
  getRequests: async (): Promise<PrivacyRequest[]> => {
    return unavailableFeature('legal/data-privacy');
  },
  updateStatus: async (_id: string, _status: PrivacyRequest['status']): Promise<void> => {
    return unavailableFeature('legal/data-privacy');
  },
  toggleLegalHold: async (_id: string): Promise<void> => {
    return unavailableFeature('legal/data-privacy');
  },
};
