export interface TrustScoreSummary {
  companionId: string;
  companionName: string;
  currentScore: number;
  lastUpdated: string | null;
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL';
}

export interface TrustScoreDetail extends TrustScoreSummary {
  punctualityScore: number | null;
  completionRateScore: number | null;
  reviewsScore: number | null;
  incidentsScore: number | null;
  history: {
    date: string;
    score: number;
    reason: string;
  }[];
  manualOverrides: {
    timestamp: string;
    previousScore: number;
    newScore: number;
    justification: string;
  }[];
}

export interface SafetyBonusRule {
  id: string;
  description: string;
  triggerEvent: string;
  bonusPoints: number;
  active: boolean;
}
