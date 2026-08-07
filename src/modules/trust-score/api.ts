import { TrustScoreSummary, TrustScoreDetail, SafetyBonusRule } from './types';

let mockSummaries: TrustScoreSummary[] = [
  { companionId: 'COMP-001', companionName: 'Ayesha Khan', currentScore: 92, lastUpdated: new Date().toISOString(), status: 'EXCELLENT' },
  { companionId: 'COMP-002', companionName: 'Rahul Singh', currentScore: 65, lastUpdated: new Date().toISOString(), status: 'NEEDS_IMPROVEMENT' },
];

let mockDetail: TrustScoreDetail = {
  ...mockSummaries[0],
  punctualityScore: 95,
  completionRateScore: 98,
  reviewsScore: 90,
  incidentsScore: 100,
  history: [
    { date: new Date().toISOString(), score: 92, reason: 'Weekly recalculation' },
    { date: new Date(Date.now() - 7*86400000).toISOString(), score: 90, reason: 'Completed 5 sessions without issues' }
  ],
  manualOverrides: []
};

let mockRules: SafetyBonusRule[] = [
  { id: 'R1', description: 'Incident-free month', triggerEvent: 'INCIDENT_FREE_MONTH', bonusPoints: 5, active: true },
  { id: 'R2', description: 'Fast SOS response history', triggerEvent: 'SOS_FAST_RESPONSE', bonusPoints: 10, active: true },
];

export const trustScoreApi = {
  getSummaries: async (): Promise<TrustScoreSummary[]> => Promise.resolve([...mockSummaries]),
  getDetail: async (id: string): Promise<TrustScoreDetail> => {
    return Promise.resolve({ ...mockDetail, companionId: id });
  },
  applyOverride: async (id: string, newScore: number, justification: string, adminName: string): Promise<TrustScoreDetail> => {
    mockDetail.manualOverrides.unshift({
      timestamp: new Date().toISOString(),
      overrideBy: adminName,
      previousScore: mockDetail.currentScore,
      newScore,
      justification
    });
    mockDetail.currentScore = newScore;
    return Promise.resolve({ ...mockDetail });
  },
  getBonusRules: async (): Promise<SafetyBonusRule[]> => Promise.resolve([...mockRules]),
  toggleBonusRule: async (id: string): Promise<void> => {
    const rule = mockRules.find(r => r.id === id);
    if (rule) rule.active = !rule.active;
    return Promise.resolve();
  }
};
