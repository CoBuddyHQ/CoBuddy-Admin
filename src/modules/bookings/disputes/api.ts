import { BookingDispute } from './types';

let mockDisputes: BookingDispute[] = [
  {
    id: 'DISP-001',
    bookingId: 'B-1001',
    customerId: 'CUST-123',
    companionId: 'COMP-456',
    raisedBy: 'CUSTOMER',
    reason: 'Companion did not show up',
    status: 'OPEN',
    amount: 1500,
    noticeGivenHours: 1,
    calculatedPenaltyPercent: 100,
    createdAt: '2026-08-05T14:30:00Z'
  },
  {
    id: 'DISP-002',
    bookingId: 'B-1005',
    customerId: 'CUST-890',
    companionId: 'COMP-112',
    raisedBy: 'COMPANION',
    reason: 'Customer was disrespectful',
    status: 'INVESTIGATING',
    amount: 3000,
    noticeGivenHours: 12,
    calculatedPenaltyPercent: 50,
    createdAt: '2026-08-06T09:15:00Z'
  }
];

export const disputesApi = {
  getDisputes: async (): Promise<BookingDispute[]> => {
    return [...mockDisputes];
  },
  
  updateDisputeStatus: async (id: string, status: BookingDispute['status']): Promise<void> => {
    mockDisputes = mockDisputes.map(d => d.id === id ? { ...d, status } : d);
  },

  overridePenalty: async (id: string, newPenalty: number, reason: string): Promise<void> => {
    mockDisputes = mockDisputes.map(d => d.id === id ? { ...d, calculatedPenaltyPercent: newPenalty, overrideReason: reason, status: 'RESOLVED_REFUND' } : d);
  }
};
