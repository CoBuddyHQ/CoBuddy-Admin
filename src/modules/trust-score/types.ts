export interface TrustScoreSummary {
  companionId: string;
  companionName: string;
  currentScore: number;
  lastUpdated: string;
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL';
}

export interface TrustScoreDetail extends TrustScoreSummary {
  punctualityScore: number;
  completionRateScore: number;
  reviewsScore: number;
  incidentsScore: number;
  history: {
    date: string;
    score: number;
    reason: string;
  }[];
  manualOverrides: {
    timestamp: string;
    overrideBy: string;
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
