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
  
  updateStatus: async (id: string, status: CustomerRecord['status']): Promise<void> => {
    mockCustomers = mockCustomers.map(c => c.id === id ? { ...c, status } : c);
  }
};
