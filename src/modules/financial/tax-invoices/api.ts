import { TaxInvoice } from './types';

let mockInvoices: TaxInvoice[] = [
  {
    id: 'INV-2023-10-001',
    companionId: 'COMP-112',
    companionName: 'Riya Sharma',
    panNumber: 'ABCDE1234F',
    gstNumber: '27ABCDE1234F1Z5',
    period: 'October 2023',
    totalEarnings: 45000,
    tdsDeducted: 4500,
    gstCollected: 8100,
    status: 'PENDING',
  },
  {
    id: 'INV-2023-10-002',
    companionId: 'COMP-887',
    companionName: 'Anjali Verma',
    panNumber: 'FGHIJ5678K',
    period: 'October 2023',
    totalEarnings: 15000,
    tdsDeducted: 1500,
    gstCollected: 0,
    status: 'GENERATED',
  }
];

export const taxInvoicesApi = {
  getInvoices: async (): Promise<TaxInvoice[]> => {
    return [...mockInvoices];
  },
  
  updateStatus: async (id: string, status: TaxInvoice['status']): Promise<void> => {
    mockInvoices = mockInvoices.map(inv => inv.id === id ? { ...inv, status } : inv);
  }
};
