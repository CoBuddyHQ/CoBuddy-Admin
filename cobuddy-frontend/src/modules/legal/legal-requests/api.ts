import axios from '@/lib/api/client';
import { LegalRequest } from './types';
export const legalRequestsApi = {
  getRequests: async (): Promise<LegalRequest[]> => {
    return (await axios.get('/legal/legal-requests')).data.data;
  },
  updateStatus: async (id: string, status: LegalRequest['status']): Promise<void> => {
    await axios.patch('/legal/legal-requests/' + encodeURIComponent(id) + '/status', { status });
  },
  createRequest: async (
    data: Omit<LegalRequest, 'id' | 'receivedDate' | 'associatedUserName'>,
  ): Promise<void> => {
    await axios.post('/legal/legal-requests', data);
  },
};
