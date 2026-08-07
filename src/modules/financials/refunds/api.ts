import { RefundRequest } from './types';

let mockRefunds: RefundRequest[] = [
  { id: 'REF-100', bookingId: 'BKG-555', userId: 'UserA', userName: 'Alice', amount: 3500, reason: 'Companion did not show up.', evidenceUrls: [], status: 'PENDING', requestedAt: new Date().toISOString() },
];

export const refundsApi = {
  getRefunds: async (): Promise<RefundRequest[]> => Promise.resolve([...mockRefunds]),
  processRefund: async (id: string, action: 'APPROVE' | 'REJECT'): Promise<void> => {
    const r = mockRefunds.find(x => x.id === id);
    if (r) {
      r.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      // If approved, in real life it would trigger payment gateway refund. We simulate it going straight to PROCESSED eventually, but here we just leave as APPROVED or jump to PROCESSED.
      if (action === 'APPROVE') r.status = 'PROCESSED';
    }
    return Promise.resolve();
  }
};
