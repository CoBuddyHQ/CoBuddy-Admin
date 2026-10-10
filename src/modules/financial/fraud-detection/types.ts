export type FraudReason = string;

export interface FraudAlert {
  id: string;
  userId: string;
  userName: string;
  userType: 'CUSTOMER' | 'COMPANION';
  reason: FraudReason;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'DISMISSED' | 'ACTION_TAKEN';
  timestamp: string;
  details: string;
}
