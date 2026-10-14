import axios from '@/lib/api/client';
import { PrivacyRequest } from './types';
export const privacyApi = {
  getRequests: async (): Promise<PrivacyRequest[]> => {
    return (await axios.get('/legal/data-privacy')).data.data;
  },
  updateStatus: async (id: string, status: PrivacyRequest['status']): Promise<void> => {
    await axios.patch('/legal/data-privacy/' + encodeURIComponent(id) + '/status', { status });
  },
  toggleLegalHold: async ({ id, legalHold }: { id: string; legalHold: boolean }): Promise<void> => {
    await axios.patch('/legal/data-privacy/' + encodeURIComponent(id) + '/hold', { legalHold });
  },
  downloadExport: async (id: string): Promise<unknown> => {
    return (await axios.get('/legal/data-privacy/' + encodeURIComponent(id) + '/export')).data.data;
  },
};
