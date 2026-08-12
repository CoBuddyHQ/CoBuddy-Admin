import { BookingDispute } from './types';
import { refundsApi } from '../../financials/refunds/api';

export function getRefundPercentForNotice(noticeHours: number, tiers: any[]): number {
  const tier = tiers.find(t => 
    noticeHours >= t.noticeHoursMin && 
    (t.noticeHoursMax === null || noticeHours < t.noticeHoursMax)
  );
  return tier ? tier.refundPercent : 0;
}

let mockDisputes: BookingDispute[] = [
  {
    id: 'DISP-001',
    bookingId: 'B-1001',
    customerId: 'CUST-123',
    companionId: 'COMP-456',
    raisedBy: 'CUSTOMER',
    reasonCode: 'no_show',
    reasonDetails: 'Companion did not show up',
    status: 'OPEN',
    amount: 1500,
    noticeGivenHours: 1,
    // Will be computed dynamically from refundsApi tiers
    calculatedPenaltyPercent: 0,
    createdAt: '2026-08-05T14:30:00Z'
  },
  {
    id: 'DISP-002',
    bookingId: 'B-1005',
    customerId: 'CUST-890',
    companionId: 'COMP-112',
    raisedBy: 'COMPANION',
    reasonCode: 'disrespectful',
    reasonDetails: 'Customer was disrespectful',
    status: 'INVESTIGATING',
    amount: 3000,
    noticeGivenHours: 12,
    calculatedPenaltyPercent: 0,
    createdAt: '2026-08-06T09:15:00Z'
  },
  {
    id: 'DISP-003',
    bookingId: 'B-1008',
    customerId: 'CUST-102',
    companionId: 'COMP-999',
    raisedBy: 'CUSTOMER',
    reasonCode: 'emergency',
    reasonDetails: 'Family emergency, cancelled 36 hours before.',
    status: 'OPEN',
    amount: 5000,
    noticeGivenHours: 36,
    calculatedPenaltyPercent: 0,
    createdAt: '2026-08-10T10:00:00Z'
  },
  {
    id: 'DISP-004',
    bookingId: 'B-1009',
    customerId: 'CUST-205',
    companionId: 'COMP-444',
    raisedBy: 'CUSTOMER',
    reasonCode: 'other',
    reasonDetails: 'Plans changed, gave 50 hours notice.',
    status: 'OPEN',
    amount: 2500,
    noticeGivenHours: 50,
    calculatedPenaltyPercent: 0,
    createdAt: '2026-08-11T09:00:00Z'
  }
];

export const disputesApi = {
  getDisputes: async (): Promise<BookingDispute[]> => {
    const settings = await refundsApi.getSettings();
    return mockDisputes.map(d => {
      // If it has been overridden or resolved, keep the override, else compute from tier
      if (d.status === 'RESOLVED_REFUND' || d.overrideReason) return d;
      const penalty = getRefundPercentForNotice(d.noticeGivenHours, settings.cancellationRefundTiers);
      return { ...d, calculatedPenaltyPercent: penalty };
    });
  },
  
  updateDisputeStatus: async (id: string, status: BookingDispute['status']): Promise<void> => {
    mockDisputes = mockDisputes.map(d => d.id === id ? { ...d, status } : d);
  },

  overridePenalty: async (id: string, newPenalty: number, reason: string): Promise<void> => {
    mockDisputes = mockDisputes.map(d => d.id === id ? { ...d, calculatedPenaltyPercent: newPenalty, overrideReason: reason, status: 'RESOLVED_REFUND' } : d);
  }
};
