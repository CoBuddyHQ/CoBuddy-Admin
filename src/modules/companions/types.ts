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
