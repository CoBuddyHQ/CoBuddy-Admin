import { ReconciliationRecord } from './types';

let mockRecords: ReconciliationRecord[] = [
  {
    id: 'pay_K1234567890abc',
    internalLedgerId: 'TXN-998877',
    amount: 1500,
    razorpayAmount: 1500,
    status: 'RECONCILED',
    date: '2023-10-27T10:00:00Z',
  },
  {
    id: 'pay_L0987654321def',
    internalLedgerId: 'TXN-998878',
    amount: 2000,
    razorpayAmount: 2000,
    status: 'FAILED',
    date: '2023-10-27T10:15:00Z',
    errorMessage: 'Webhook signature verification failed.'
  },
  {
    id: 'pay_M1122334455ghi',
    internalLedgerId: 'TXN-998879',
    amount: 3500,
    razorpayAmount: 3000,
    status: 'MISMATCH',
    date: '2023-10-27T10:30:00Z',
    errorMessage: 'Amount discrepancy between Razorpay (3000) and Internal (3500).'
  }
];

export const reconciliationApi = {
  getRecords: async (): Promise<ReconciliationRecord[]> => {
    return [...mockRecords];
  },
  
  updateStatus: async (id: string, status: ReconciliationRecord['status']): Promise<void> => {
    mockRecords = mockRecords.map(r => r.id === id ? { ...r, status, errorMessage: status === 'RECONCILED' ? undefined : r.errorMessage } : r);
  },

  retryWebhook: async (id: string): Promise<void> => {
    mockRecords = mockRecords.map(r => r.id === id ? { ...r, status: 'RECONCILED', errorMessage: undefined } : r);
  }
};
