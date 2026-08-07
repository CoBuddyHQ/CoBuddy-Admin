import { CompanionRecord } from './types';

let mockCompanions: CompanionRecord[] = [
  {
    id: 'COMP-2001',
    name: 'Neha Gupta',
    email: 'neha.g@example.com',
    phone: '+91 9876543211',
    joinDate: '2023-01-10',
    verificationStatus: 'VERIFIED',
    trustScore: 98,
    totalEarnings: 125000,
    totalSessions: 45,
    status: 'ACTIVE'
  },
  {
    id: 'COMP-2002',
    name: 'Vikram Singh',
    email: 'vikram.s@example.com',
    phone: '+91 8765432112',
    joinDate: '2023-02-15',
    verificationStatus: 'VERIFIED',
    trustScore: 85,
    totalEarnings: 45000,
    totalSessions: 12,
    status: 'ACTIVE'
  },
  {
    id: 'COMP-2003',
    name: 'Priya Desai',
    email: 'priya.d@example.com',
    phone: '+91 7654321123',
    joinDate: '2023-06-20',
    verificationStatus: 'REJECTED',
    trustScore: 30,
    totalEarnings: 0,
    totalSessions: 0,
    status: 'BANNED'
  }
];

export const companionsApi = {
  getCompanions: async (): Promise<CompanionRecord[]> => {
    return [...mockCompanions];
  },
  
  updateStatus: async (id: string, status: CompanionRecord['status']): Promise<void> => {
    mockCompanions = mockCompanions.map(c => c.id === id ? { ...c, status } : c);
  }
};
