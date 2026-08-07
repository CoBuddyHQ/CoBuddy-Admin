import { CustomerRecord } from './types';

let mockCustomers: CustomerRecord[] = [
  {
    id: 'CUST-1001',
    name: 'Rahul Sharma',
    email: 'rahul.s@example.com',
    phone: '+91 9876543210',
    joinDate: '2023-08-15',
    verificationStatus: 'VERIFIED',
    totalBookings: 12,
    walletBalance: 2500,
    flags: 0,
    status: 'ACTIVE'
  },
  {
    id: 'CUST-1002',
    name: 'Amit Patel',
    email: 'amit.p@example.com',
    phone: '+91 8765432109',
    joinDate: '2023-09-01',
    verificationStatus: 'PENDING',
    totalBookings: 0,
    walletBalance: 0,
    flags: 1,
    status: 'ACTIVE'
  },
  {
    id: 'CUST-1003',
    name: 'Suresh Kumar',
    email: 'suresh.k@example.com',
    phone: '+91 7654321098',
    joinDate: '2023-07-20',
    verificationStatus: 'REJECTED',
    totalBookings: 3,
    walletBalance: 150,
    flags: 5,
    status: 'SUSPENDED'
  }
];

export const customersApi = {
  getCustomers: async (): Promise<CustomerRecord[]> => {
    return [...mockCustomers];
  },
  getCustomerById: async (id: string): Promise<CustomerRecord | undefined> => {
    return mockCustomers.find(c => c.id === id);
  },
  updateStatus: async (id: string, status: CustomerRecord['status']): Promise<void> => {
    mockCustomers = mockCustomers.map(c => c.id === id ? { ...c, status } : c);
  },
  getBookingHistory: async (id: string): Promise<import('./types').BookingHistoryEntry[]> => {
    return [
      { id: 'B1', date: '2026-08-01', companionName: 'Neha Gupta', activity: 'Coffee', venue: 'Starbucks', status: 'COMPLETED', amount: 1500 },
      { id: 'B2', date: '2026-08-10', companionName: 'Vikram Singh', activity: 'Movie', venue: 'PVR', status: 'UPCOMING', amount: 3000 }
    ];
  },
  getTransactionHistory: async (id: string): Promise<import('./types').TransactionEntry[]> => {
    return [
      { id: 'T1', date: '2026-07-28', type: 'CREDIT', amount: 5000, description: 'Wallet top-up' },
      { id: 'T2', date: '2026-08-01', type: 'DEBIT', amount: 1500, description: 'Payment for booking B1' },
      { id: 'T3', date: '2026-08-05', type: 'DEBIT', amount: 3000, description: 'Payment for booking B2' }
    ];
  }
};
