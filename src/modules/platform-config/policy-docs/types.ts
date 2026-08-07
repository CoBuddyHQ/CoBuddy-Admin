export interface PolicyDocument {
  id: string;
  type: 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'COMMUNITY_GUIDELINES';
  version: string;
  publishStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  lastUpdated: string;
  consentCount: number;
}

export interface ConsentLog {
  id: string;
  userId: string;
  documentType: string;
  documentVersion: string;
  timestamp: string;
  ipAddress: string;
}

export interface LegalSettings {
  contactEmail: string;
  supportPhone: string;
  termsUrl: string;
  privacyUrl: string;
}
