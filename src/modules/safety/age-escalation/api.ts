import { AgeEscalationCase } from './types';

let mockCases: AgeEscalationCase[] = [
  { id: 'AGE-001', userId: 'CompY', userName: 'Charlie', dobMismatchDetails: 'Aadhaar says 2005 (age 21), selfie AI estimates 16.', idEstimate: 21, selfieEstimate: 16, associatedRecordLink: '/verification', status: 'PENDING_REVIEW', timestamp: new Date().toISOString() },
];

export const ageEscalationApi = {
  getCases: async (): Promise<AgeEscalationCase[]> => Promise.resolve([...mockCases]),
  updateStatus: async (id: string, status: AgeEscalationCase['status']): Promise<void> => {
    const c = mockCases.find(x => x.id === id);
    if (c) c.status = status;
    return Promise.resolve();
  }
};
