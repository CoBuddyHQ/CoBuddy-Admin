export interface EscrowRecord {
  id: string;
  userId: string;
  userName: string;
  userType: 'CUSTOMER' | 'COMPANION';
  walletBalance: number;
  escrowHeldAmount: number;
  status: 'ACTIVE' | 'FROZEN';
  lastTransactionDate: string;
}

export interface WithdrawalLimitConfig {
  maxPerTransaction: number;
  maxPerDay: number;
}
