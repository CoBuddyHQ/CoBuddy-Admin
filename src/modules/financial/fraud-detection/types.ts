export type FraudReason = 'DUPLICATE_ACCOUNT' | 'GPS_SPOOFING' | 'FAKE_SELFIE' | 'SUSPICIOUS_TRANSACTION';

export interface FraudAlert {
  id: string;
  userId: string;
  userName: string;
  userType: 'CUSTOMER' | 'COMPANION';
  reason: FraudReason;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'FROZEN' | 'CLEARED' | 'ESCALATED';
  timestamp: string;
  details: string;
}
