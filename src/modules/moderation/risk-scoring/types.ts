export interface RiskScore {
  userId: string;
  userName: string;
  userType: 'CUSTOMER' | 'COMPANION';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  deviceFlags: number;
  gpsSpoofFlags: number;
  duplicateAccountSignals: number;
  lastUpdated: string;
}
