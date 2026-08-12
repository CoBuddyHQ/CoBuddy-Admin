import { PolicyDocument, ConsentLog, LegalSettings } from './types';

let mockPolicies: PolicyDocument[] = [
  {
    id: 'POL-001',
    title: { en: 'Terms of Service', hi: 'सेवा की शर्तें' },
    content: { en: 'Terms of Service content...', hi: 'सेवा की शर्तें सामग्री...' },
    type: 'TERMS_OF_SERVICE',
    version: 'v2.1',
    publishStatus: 'PUBLISHED',
    lastUpdated: '2023-10-01',
    consentCount: 15420
  },
  {
    id: 'POL-002',
    title: { en: 'Privacy Policy', hi: 'गोपनीयता नीति' },
    content: { en: 'Privacy Policy content...', hi: 'गोपनीयता नीति सामग्री...' },
    type: 'PRIVACY_POLICY',
    version: 'v1.4',
    publishStatus: 'PUBLISHED',
    lastUpdated: '2023-08-15',
    consentCount: 15415
  },
  {
    id: 'POL-003',
    title: { en: 'Community Guidelines', hi: 'सामुदायिक दिशानिर्देश' },
    content: { en: 'Community Guidelines content...', hi: 'सामुदायिक दिशानिर्देश सामग्री...' },
    type: 'COMMUNITY_GUIDELINES',
    version: 'v3.0',
    publishStatus: 'DRAFT',
    lastUpdated: '2023-10-25',
    consentCount: 0
  },
  {
    id: 'POL-004',
    title: { en: 'Refund Policy', hi: 'धनवापसी नीति' },
    content: { en: 'Refund Policy content...', hi: 'धनवापसी नीति सामग्री...' },
    type: 'REFUND_POLICY',
    version: 'v1.0',
    publishStatus: 'PUBLISHED',
    lastUpdated: '2023-11-01',
    consentCount: 1540
  }
];

const mockConsentLogs: ConsentLog[] = [
  { id: 'LOG-1', userId: 'USR-882', documentType: 'TERMS_OF_SERVICE', documentVersion: 'v2.1', timestamp: '2023-10-02T10:00:00Z', ipAddress: '192.168.1.1' },
  { id: 'LOG-2', userId: 'COMP-112', documentType: 'TERMS_OF_SERVICE', documentVersion: 'v2.1', timestamp: '2023-10-02T10:15:00Z', ipAddress: '10.0.0.5' },
];

let mockSettings: LegalSettings = {
  contactEmail: 'support@cobuddy.app',
  supportPhone: '+91 9876543210',
  termsUrl: 'https://cobuddy.app/terms',
  privacyUrl: 'https://cobuddy.app/privacy',
};

export const policyApi = {
  getPolicies: async (): Promise<PolicyDocument[]> => {
    return [...mockPolicies];
  },
  
  updatePolicyStatus: async (id: string, status: PolicyDocument['publishStatus']): Promise<void> => {
    mockPolicies = mockPolicies.map(p => p.id === id ? { ...p, publishStatus: status } : p);
  },

  createDocument: async (data: Omit<PolicyDocument, 'id' | 'publishStatus' | 'lastUpdated' | 'consentCount' | 'version'>): Promise<void> => {
    const newDoc: PolicyDocument = {
      ...data,
      id: `POL-00${mockPolicies.length + 1}`,
      publishStatus: 'DRAFT',
      lastUpdated: new Date().toISOString().split('T')[0],
      consentCount: 0,
      version: 'v1.0'
    };
    mockPolicies = [newDoc, ...mockPolicies];
  },

  getConsentLogs: async (): Promise<ConsentLog[]> => {
    return [...mockConsentLogs];
  },
  
  getSettings: async (): Promise<LegalSettings> => Promise.resolve({ ...mockSettings }),
  updateSettings: async (settings: LegalSettings): Promise<void> => {
    mockSettings = { ...settings };
    return Promise.resolve();
  }
};
