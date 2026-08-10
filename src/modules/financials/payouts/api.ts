import { PayoutItem } from './types';

const mockPayouts: PayoutItem[] = [
  { id: 'PO-1001', companionId: 'C-001', companionName: 'Priya Sharma', amount: 14500, periodStart: '2023-10-01', periodEnd: '2023-10-15', status: 'PENDING', dueDate: '2023-10-18', payoutMethod: { type: 'UPI', accountDetails: 'priya***@okhdfcbank', verified: true } },
  { id: 'PO-1002', companionId: 'C-042', companionName: 'Rahul Verma', amount: 8200, periodStart: '2023-10-01', periodEnd: '2023-10-15', status: 'ON_HOLD', dueDate: '2023-10-18', payoutMethod: { type: 'BANK', accountDetails: 'A/C ****1234, HDFC Bank', verified: false } },
  { id: 'PO-1003', companionId: 'C-017', companionName: 'Anita Desai', amount: 21000, periodStart: '2023-09-15', periodEnd: '2023-09-30', status: 'PAID', dueDate: '2023-10-03', payoutMethod: { type: 'BANK', accountDetails: 'A/C ****9876, SBI', verified: true } }
];

export const payoutsApi = {
  getPayouts: async (): Promise<PayoutItem[]> => Promise.resolve([...mockPayouts]),
  processPayout: async (id: string): Promise<void> => {
    const p = mockPayouts.find(x => x.id === id);
    if (p) p.status = 'PROCESSING';
    return Promise.resolve();
  },
  holdPayout: async (id: string): Promise<void> => {
    const p = mockPayouts.find(x => x.id === id);
    if (p) p.status = 'ON_HOLD';
    return Promise.resolve();
  }
};
