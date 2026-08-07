export interface GrowthAbuseAlert {
  id: string;
  type: 'REFERRAL_FARMING' | 'BOT_SIGNUP' | 'MASS_ONBOARDING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  targetId: string;
  targetName: string;
  details: string;
  timestamp: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'ACTIONED';
}
