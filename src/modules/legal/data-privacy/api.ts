import { PrivacyRequest } from './types';

let mockRequests: PrivacyRequest[] = [
  {
    id: 'REQ-101',
    userId: 'USR-882',
    userName: 'Karan Malhotra',
    requestType: 'DATA_EXPORT',
    status: 'PENDING',
    legalHold: false,
    requestDate: '2023-10-25T10:00:00Z',
    dueDate: '2023-11-24T10:00:00Z'
  },
  {
    id: 'REQ-102',
    userId: 'COMP-112',
    userName: 'Riya Sharma',
    requestType: 'ACCOUNT_DELETION',
    status: 'PENDING',
    legalHold: true,
    requestDate: '2023-10-26T14:30:00Z',
    dueDate: '2023-11-25T14:30:00Z'
  }
];

export const privacyApi = {
  getRequests: async (): Promise<PrivacyRequest[]> => {
    return [...mockRequests];
  },
  
  updateStatus: async (id: string, status: PrivacyRequest['status']): Promise<void> => {
    mockRequests = mockRequests.map(r => r.id === id ? { ...r, status } : r);
  },

  toggleLegalHold: async (id: string): Promise<void> => {
    mockRequests = mockRequests.map(r => r.id === id ? { ...r, legalHold: !r.legalHold } : r);
  }
};
