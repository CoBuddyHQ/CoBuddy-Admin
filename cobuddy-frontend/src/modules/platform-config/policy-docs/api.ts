import axios from '@/lib/api/client';
import { PolicyDocument, ConsentLog, LegalSettings } from './types';
export const policyApi = {
  updateDocument: async ({
    id,
    data,
  }: {
    id: string;
    data: {
      title: Record<string, string>;
      content?: Record<string, string>;
      type: PolicyDocument['type'];
    };
  }): Promise<void> => {
    await axios.put('/platform-config/policy-docs/' + encodeURIComponent(id), data);
  },
  getPolicies: async (): Promise<PolicyDocument[]> => {
    return (await axios.get('/platform-config/policy-docs')).data.data;
  },
  updatePolicyStatus: async (
    id: string,
    status: PolicyDocument['publishStatus'],
  ): Promise<void> => {
    await axios.patch('/platform-config/policy-docs/' + encodeURIComponent(id) + '/status', {
      status,
    });
  },
  createDocument: async (
    data: Omit<PolicyDocument, 'id' | 'publishStatus' | 'lastUpdated' | 'consentCount' | 'version'>,
  ): Promise<void> => {
    await axios.post('/platform-config/policy-docs', data);
  },
  getConsentLogs: async (): Promise<ConsentLog[]> => {
    return (await axios.get('/platform-config/policy-docs/consents')).data.data;
  },
  getSettings: async (): Promise<LegalSettings> => {
    return (await axios.get('/platform-config/policy-docs/settings')).data.data;
  },
  updateSettings: async (settings: LegalSettings): Promise<void> => {
    await axios.put('/platform-config/policy-docs/settings', settings);
  },
};
