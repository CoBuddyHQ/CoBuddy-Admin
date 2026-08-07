import { PolicyDocument, ConsentLog } from './types';

let mockPolicies: PolicyDocument[] = [
  {
    id: 'POL-001',
    type: 'TERMS_OF_SERVICE',
    version: 'v2.1',
    publishStatus: 'PUBLISHED',
    lastUpdated: '2023-10-01',
    consentCount: 15420
  },
  {
    id: 'POL-002',
    type: 'PRIVACY_POLICY',
    version: 'v1.4',
    publishStatus: 'PUBLISHED',
    lastUpdated: '2023-08-15',
    consentCount: 15415
  },
  {
    id: 'POL-003',
    type: 'COMMUNITY_GUIDELINES',
    version: 'v3.0',
    publishStatus: 'DRAFT',
    lastUpdated: '2023-10-25',
    consentCount: 0
  }
];

let mockConsentLogs: ConsentLog[] = [
  { id: 'LOG-1', userId: 'USR-882', documentType: 'TERMS_OF_SERVICE', documentVersion: 'v2.1', timestamp: '2023-10-02T10:00:00Z', ipAddress: '192.168.1.1' },
  { id: 'LOG-2', userId: 'COMP-112', documentType: 'TERMS_OF_SERVICE', documentVersion: 'v2.1', timestamp: '2023-10-02T10:15:00Z', ipAddress: '10.0.0.5' },
];

export const policyApi = {
  getPolicies: async (): Promise<PolicyDocument[]> => {
    return [...mockPolicies];
  },
  
  updatePolicyStatus: async (id: string, status: PolicyDocument['publishStatus']): Promise<void> => {
    mockPolicies = mockPolicies.map(p => p.id === id ? { ...p, publishStatus: status } : p);
  },

  getConsentLogs: async (): Promise<ConsentLog[]> => {
    return [...mockConsentLogs];
  }
};
