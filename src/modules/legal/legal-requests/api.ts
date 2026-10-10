import { unavailableFeature } from '@/lib/unavailable-feature';
import { LegalRequest } from './types';
export const legalRequestsApi = {
  getRequests: async (): Promise<LegalRequest[]> => {
    return unavailableFeature('legal/legal-requests');
  },
  updateStatus: async (_id: string, _status: LegalRequest['status']): Promise<void> => {
    return unavailableFeature('legal/legal-requests');
  },
  createRequest: async (_data: Omit<LegalRequest, 'id' | 'receivedDate'>): Promise<void> => {
    return unavailableFeature('legal/legal-requests');
  },
};
