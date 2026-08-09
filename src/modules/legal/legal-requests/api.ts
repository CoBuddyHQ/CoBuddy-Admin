import { LegalRequest } from './types';

let mockRequests: LegalRequest[] = [
  {
    id: 'LGL-001',
    agencyName: 'Cyber Crime Cell, Mumbai',
    requestType: 'INFO_REQUEST',
    associatedUserId: 'CUST-8899',
    associatedUserName: 'Sameer K.',
    status: 'OPEN',
    receivedDate: '2023-10-20T10:00:00Z',
    deadline: '2023-11-20T10:00:00Z',
    internalNotes: 'Requesting login IPs for the last 30 days.',
    documentUrls: ['https://mock-storage.cobuddy.com/docs/notice_789.pdf']
  },
  {
    id: 'LGL-002',
    agencyName: 'Delhi Police',
    requestType: 'SUBPOENA',
    associatedUserId: 'COMP-112',
    associatedUserName: 'Riya Sharma',
    status: 'EVIDENCE_PRESERVED',
    receivedDate: '2023-10-25T14:30:00Z',
    deadline: '2023-11-05T14:30:00Z',
    internalNotes: 'Subpoena for chat records related to Incident INC-554.',
    documentUrls: ['https://mock-storage.cobuddy.com/docs/subpoena_112.pdf', 'https://mock-storage.cobuddy.com/docs/warrant_554.pdf']
  }
];

export const legalRequestsApi = {
  getRequests: async (): Promise<LegalRequest[]> => {
    return [...mockRequests];
  },
  
  updateStatus: async (id: string, status: LegalRequest['status']): Promise<void> => {
    mockRequests = mockRequests.map(r => r.id === id ? { ...r, status } : r);
  },

  createRequest: async (data: Omit<LegalRequest, 'id' | 'receivedDate'>): Promise<void> => {
    const newRequest: LegalRequest = {
      ...data,
      id: `LGL-${Date.now()}`,
      receivedDate: new Date().toISOString()
    };
    mockRequests = [newRequest, ...mockRequests];
  }
};
