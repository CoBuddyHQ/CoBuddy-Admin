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
  getCompanionById: async (id: string): Promise<CompanionRecord | undefined> => {
    return mockCompanions.find(c => c.id === id);
  },
  updateStatus: async (id: string, status: CompanionRecord['status']): Promise<void> => {
    mockCompanions = mockCompanions.map(c => c.id === id ? { ...c, status } : c);
  },
  getTrustScoreHistory: async (id: string): Promise<import('./types').TrustScoreHistoryEntry[]> => {
    return [
      { id: '1', date: '2026-08-01', oldScore: 90, newScore: 85, reason: 'Late cancellation' },
      { id: '2', date: '2026-07-15', oldScore: 88, newScore: 90, reason: '5-star review from verified booking' }
    ];
  },
  getSessionHistory: async (id: string): Promise<import('./types').SessionHistoryEntry[]> => {
    return [
      { id: 'S1', date: '2026-08-05', customerName: 'Aarav M.', activity: 'Coffee', durationMins: 120, earnings: 1500 },
      { id: 'S2', date: '2026-08-02', customerName: 'Karan P.', activity: 'Movie', durationMins: 180, earnings: 3000 }
    ];
  },
  getEarningsBreakdown: async (id: string): Promise<import('./types').EarningsBreakdown> => {
    return {
      baseEarnings: 100000,
      bonusEarnings: 25000,
      platformFeeDeducted: 12500,
      totalNet: 112500
    };
  }
};
