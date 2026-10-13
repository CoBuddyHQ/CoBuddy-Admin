export interface RiskScore {
  userId: string;
  userName: string;
  userType: 'CUSTOMER' | 'COMPANION';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  deviceFlags: number | null;
  gpsSpoofFlags: number | null;
  duplicateAccountSignals: number | null;
  lastUpdated: string;
}
