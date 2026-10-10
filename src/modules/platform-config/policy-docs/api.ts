import { unavailableFeature } from '@/lib/unavailable-feature';
import { PolicyDocument, ConsentLog, LegalSettings } from './types';
export const policyApi = {
  getPolicies: async (): Promise<PolicyDocument[]> => {
    return unavailableFeature('platform-config/policy-docs');
  },
  updatePolicyStatus: async (
    _id: string,
    _status: PolicyDocument['publishStatus'],
  ): Promise<void> => {
    return unavailableFeature('platform-config/policy-docs');
  },
  createDocument: async (
    _data: Omit<
      PolicyDocument,
      'id' | 'publishStatus' | 'lastUpdated' | 'consentCount' | 'version'
    >,
  ): Promise<void> => {
    return unavailableFeature('platform-config/policy-docs');
  },
  getConsentLogs: async (): Promise<ConsentLog[]> => {
    return unavailableFeature('platform-config/policy-docs');
  },
  getSettings: async (): Promise<LegalSettings> => {
    return unavailableFeature('platform-config/policy-docs');
  },
  updateSettings: async (_settings: LegalSettings): Promise<void> => {
    return unavailableFeature('platform-config/policy-docs');
  },
};
