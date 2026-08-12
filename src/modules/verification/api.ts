import { VerificationCase, DecisionPayload, AutomationThresholds } from './types';
import { DEFAULT_THRESHOLDS } from './constants';
// import axios from '@/lib/api/client';

const mockCases: VerificationCase[] = [
  {
    id: 'CASE-4821',
    applicantName: 'Riya Sharma',
    applicantType: 'COMPANION',
    faceMatchScore: 62,
    livenessPass: true,
    documentValid: true,
    status: 'PENDING_MANUAL_REVIEW',
    submittedAt: new Date().toISOString(),
    documentType: 'national_id',
    idDocumentUrl: 'https://placehold.co/400x300?text=ID+Document',
    selfieUrl: 'https://placehold.co/300x400?text=Selfie',
    backgroundDeclarationUrl: 'https://example.com/declaration.pdf',
    auditTrail: [
      {
        timestamp: new Date().toISOString(),
        action: 'Auto-check ran',
        actor: 'System',
        notes: 'Flagged for manual review (62%)'
      }
    ]
  },
  {
    id: 'CASE-4820',
    applicantName: 'Amit Kumar',
    applicantType: 'CUSTOMER',
    faceMatchScore: 95,
    livenessPass: true,
    documentValid: true,
    status: 'AUTO_APPROVED',
    submittedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    documentType: 'driving_license',
    idDocumentUrl: 'https://placehold.co/400x300?text=ID+Document',
    selfieUrl: 'https://placehold.co/300x400?text=Selfie',
    auditTrail: [
      {
        timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
        action: 'Auto-check ran',
        actor: 'System',
        notes: 'Auto-approved (95%)'
      }
    ]
  }
];

let currentThresholds: AutomationThresholds = { ...DEFAULT_THRESHOLDS };

export const verificationApi = {
  getCases: async (statusFilter?: string): Promise<VerificationCase[]> => {
    let filtered = mockCases;
    if (statusFilter && statusFilter !== 'ALL') {
      filtered = filtered.filter(c => 
        statusFilter === 'PENDING' ? c.status === 'PENDING_MANUAL_REVIEW' : 
        c.status.includes(statusFilter)
      );
    }
    return Promise.resolve([...filtered]);
  },

  submitDecision: async (payload: DecisionPayload): Promise<VerificationCase> => {
    const c = mockCases.find(x => x.id === payload.caseId);
    if (!c) throw new Error('Case not found');
    
    c.status = payload.decision === 'APPROVE' ? 'APPROVED' : 
               payload.decision === 'REJECT' ? 'REJECTED' : 'PENDING_MANUAL_REVIEW';
               
    c.auditTrail.unshift({
      timestamp: new Date().toISOString(),
      action: `Decision: ${payload.decision}`,
      actor: 'Admin', // Would be logged-in user in real app
      notes: payload.notes || payload.reason
    });
    
    return Promise.resolve(c);
  },

  getThresholds: async (): Promise<AutomationThresholds> => {
    return Promise.resolve({ ...currentThresholds });
  },

  updateThresholds: async (payload: AutomationThresholds): Promise<AutomationThresholds> => {
    currentThresholds = { ...payload };
    return Promise.resolve(currentThresholds);
  }
};
