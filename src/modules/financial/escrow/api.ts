import { EscrowRecord, WithdrawalLimitConfig } from './types';

let mockRecords: EscrowRecord[] = [
  { id: 'W-001', userId: 'USR-123', userName: 'Alice Smith', userType: 'COMPANION', walletBalance: 12500, escrowHeldAmount: 3000, status: 'ACTIVE', lastTransactionDate: '2023-10-27T10:00:00Z' },
  { id: 'W-002', userId: 'USR-456', userName: 'Bob Jones', userType: 'CUSTOMER', walletBalance: 500, escrowHeldAmount: 500, status: 'ACTIVE', lastTransactionDate: '2023-10-26T14:30:00Z' },
  { id: 'W-003', userId: 'USR-789', userName: 'Charlie Brown', userType: 'COMPANION', walletBalance: 8000, escrowHeldAmount: 0, status: 'FROZEN', lastTransactionDate: '2023-10-25T09:15:00Z' },
];

let mockConfig: WithdrawalLimitConfig = {
  maxPerTransaction: 4500,
  maxPerDay: 10000,
};

export const escrowApi = {
  getRecords: async (): Promise<EscrowRecord[]> => {
    return [...mockRecords];
  },
  
  releaseEscrow: async (id: string, amount: number): Promise<void> => {
    mockRecords = mockRecords.map(r => {
      if (r.id === id) {
        return { ...r, escrowHeldAmount: Math.max(0, r.escrowHeldAmount - amount), walletBalance: r.walletBalance + amount };
      }
      return r;
    });
  },

  updateStatus: async (id: string, status: 'ACTIVE' | 'FROZEN'): Promise<void> => {
    mockRecords = mockRecords.map(r => r.id === id ? { ...r, status } : r);
  },

  getWithdrawalLimits: async (): Promise<WithdrawalLimitConfig> => {
    return { ...mockConfig };
  },

  updateWithdrawalLimits: async (config: WithdrawalLimitConfig): Promise<void> => {
    mockConfig = { ...config };
  }
};
