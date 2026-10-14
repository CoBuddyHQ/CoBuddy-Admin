export interface SafetyAnalytics {
  activeRestrictions: number;
  repeatOffenders: number;
  repeatOffenderRate: number;
  fraudHits: number;
  spoofHits: number;
  totalAgeEscalations: number;
  resolvedAgeEscalations: number;
  ageResolutionRate: number;
  measuredAt: string;
}
