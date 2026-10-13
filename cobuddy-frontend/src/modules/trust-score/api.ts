import { TrustScoreSummary, TrustScoreDetail, SafetyBonusRule } from './types';
import axios from '@/lib/api/client';

const statusFor = (score: number): TrustScoreSummary['status'] =>
  score >= 80 ? 'EXCELLENT' : score >= 60 ? 'GOOD' : score >= 40 ? 'NEEDS_IMPROVEMENT' : 'CRITICAL';
const mapSummary = (item: any): TrustScoreSummary => ({
  companionId: item.id,
  companionName: item.name,
  currentScore: item.trustScore,
  lastUpdated: item.updatedAt ?? null,
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
    const companions = response.data.data?.companions ?? [];
    return companions.map(mapSummary);
  },
  getDetail: async (id: string): Promise<TrustScoreDetail> => {
    const [profile, response] = await Promise.all([
      axios.get(`/companions/${id}`),
      axios.get(`/trust-score/${id}/history`),
    ]);
    const companion = profile.data.data;
    const history = response.data.data ?? [];
    return {
      ...mapSummary(companion),
      punctualityScore: null,
      completionRateScore: null,
      reviewsScore: null,
      incidentsScore: null,
      history: history.map((entry: any) => ({
        date: entry.date,
        score: entry.newScore,
        reason: entry.reason,
      })),
      manualOverrides: history
        .filter((entry: any) => entry.reasonCategory === 'admin_override')
        .map((entry: any) => ({
          timestamp: entry.date,
          previousScore: entry.oldScore,
          newScore: entry.newScore,
          justification: entry.reason,
        })),
    };
  },
  applyOverride: async (
    id: string,
    newScore: number,
    justification: string,
  ): Promise<TrustScoreDetail> => {
    await axios.patch(`/companions/${id}/trust-score`, { newScore, reason: justification });
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
