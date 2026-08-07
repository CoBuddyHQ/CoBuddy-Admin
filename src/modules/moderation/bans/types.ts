export interface UserRestriction {
  userId: string;
  userName: string;
  userType: 'CUSTOMER' | 'COMPANION';
  restrictionType: 'TEMP_BAN' | 'PERM_BAN' | 'WARNING' | 'FEATURE_LOCK';
  reason: string;
  appliedAt: string;
  expiresAt?: string; // undefined if permanent
  historyCount: number;
}
