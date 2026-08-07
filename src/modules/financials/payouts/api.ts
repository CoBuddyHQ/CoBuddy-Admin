import { PayoutItem } from './types';

const mockPayouts: PayoutItem[] = [
  { id: 'PAY-001', companionId: 'CompA', companionName: 'Alice', amount: 12500, periodStart: '2026-07-01', periodEnd: '2026-07-15', status: 'PENDING', dueDate: new Date().toISOString() },
  { id: 'PAY-002', companionId: 'CompB', companionName: 'Bob', amount: 8400, periodStart: '2026-07-01', periodEnd: '2026-07-15', status: 'ON_HOLD', dueDate: new Date().toISOString() },
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
