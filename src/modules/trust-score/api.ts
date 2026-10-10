import { TrustScoreSummary, TrustScoreDetail, SafetyBonusRule } from './types';
import axios from '@/lib/api/client';

const statusFor = (score: number): TrustScoreSummary['status'] =>
  score >= 80 ? 'EXCELLENT' : score >= 60 ? 'GOOD' : score >= 40 ? 'NEEDS_IMPROVEMENT' : 'CRITICAL';
const mapSummary = (item: any): TrustScoreSummary => ({
  companionId: item.id,
  companionName: item.name,
  currentScore: item.trustScore,
  lastUpdated: item.updatedAt || new Date().toISOString(),
  status: statusFor(item.trustScore),
});
const mapRule = (rule: any): SafetyBonusRule => ({
  id: rule.id,
  description: rule.description || rule.trigger,
  triggerEvent: rule.trigger,
  bonusPoints: rule.delta,
  active: rule.enabled,
});

export const trustScoreApi = {
  getSummaries: async (): Promise<TrustScoreSummary[]> => {
    const response = await axios.get('/trust-score/dashboard');
    const top10 = response.data.data?.top10 ?? [];
    return top10.map(mapSummary);
  },
  getDetail: async (id: string): Promise<TrustScoreDetail> => {
    const response = await axios.get(`/trust-score/${id}/history`);
    const history = response.data.data ?? [];
    const currentScore = history[0]?.newScore ?? 0;
    return {
      ...mapSummary({ id, name: id, trustScore: currentScore }),
      punctualityScore: currentScore,
      completionRateScore: currentScore,
      reviewsScore: currentScore,
      incidentsScore: currentScore,
      history: history.map((entry: any) => ({
        date: entry.date,
        score: entry.newScore,
        reason: entry.reason,
      })),
      manualOverrides: [],
    };
  },
  applyOverride: async (
    id: string,
    _newScore?: number,
    _justification?: string,
    _adminName?: string,
  ): Promise<TrustScoreDetail> => {
    await axios.post(`/trust-score/recompute/${id}`);
    return trustScoreApi.getDetail(id);
  },
  getBonusRules: async (): Promise<SafetyBonusRule[]> => {
    const response = await axios.get('/trust-score/rules');
    const rules = response.data.data ?? [];
    return rules.map(mapRule);
  },
  toggleBonusRule: async (id: string): Promise<void> => {
    const rulesResponse = await axios.get('/trust-score/rules');
    const rules = rulesResponse.data.data ?? [];
    const rule = rules.find((item: any) => item.id === id);
    if (!rule) throw new Error('Rule not found');
    await axios.patch(`/trust-score/rules/${id}`, { enabled: !rule.enabled });
  },
};
