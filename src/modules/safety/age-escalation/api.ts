import { AgeEscalationCase } from './types';

const mockCases: AgeEscalationCase[] = [
  { id: 'AGE-001', userId: 'CompY', userName: 'Charlie', dobMismatchDetails: 'Aadhaar says 2005 (age 21), selfie AI estimates 16.', idEstimate: 21, selfieEstimate: 16, associatedRecordLink: '/verification', status: 'PENDING_REVIEW', timestamp: new Date().toISOString() },
  { id: 'AGE-002', userId: 'CompZ', userName: 'David', dobMismatchDetails: 'Aadhaar says 1999 (age 27), selfie AI estimates 17.', idEstimate: 27, selfieEstimate: 17, associatedRecordLink: '/verification', status: 'RESOLVED_BANNED', timestamp: new Date(Date.now() - 86400000).toISOString(), resolutionNote: 'Confirmed underage via manual review. Banned.' },
  { id: 'AGE-003', userId: 'CompW', userName: 'Eve', dobMismatchDetails: 'Aadhaar says 2001 (age 25), selfie AI estimates 18.', idEstimate: 25, selfieEstimate: 18, associatedRecordLink: '/verification', status: 'RESOLVED_CLEARED', timestamp: new Date(Date.now() - 172800000).toISOString(), resolutionNote: 'Verified identity and age manually. Cleared.' },
];

export const ageEscalationApi = {
  getCases: async (): Promise<AgeEscalationCase[]> => Promise.resolve([...mockCases]),
  updateStatus: async (id: string, status: AgeEscalationCase['status'], resolutionNote?: string): Promise<void> => {
    const c = mockCases.find(x => x.id === id);
    if (c) {
      c.status = status;
      if (resolutionNote) c.resolutionNote = resolutionNote;
    }
    return Promise.resolve();
  }
};
