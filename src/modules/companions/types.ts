export interface CompanionRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  trustScore: number;
  totalEarnings: number;
  totalSessions: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
}

export interface TrustScoreHistoryEntry {
  id: string;
  date: string;
  oldScore: number;
  newScore: number;
  reason: string;
}

export interface SessionHistoryEntry {
  id: string;
  date: string;
  customerName: string;
  activity: string;
  durationMins: number;
  earnings: number;
}

export interface EarningsBreakdown {
  baseEarnings: number;
  bonusEarnings: number;
  platformFeeDeducted: number;
  totalNet: number;
}
