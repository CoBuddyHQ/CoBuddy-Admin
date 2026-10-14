import { RiskScore } from './types';
import axios from '@/lib/api/client';

const mapRisk = (item: any): RiskScore => ({
  userId: item.userId,
  userName: item.userId,
  userType: item.userType,
  riskLevel:
    item.riskScore >= 80
      ? 'CRITICAL'
      : item.riskScore >= 60
        ? 'HIGH'
        : item.riskScore >= 30
          ? 'MEDIUM'
          : 'LOW',
  deviceFlags: null,
  gpsSpoofFlags: null,
  duplicateAccountSignals: null,
  lastUpdated: item.updatedAt || item.createdAt,
});

export const riskScoringApi = {
  getScores: async (): Promise<RiskScore[]> => {
    const res = await axios.get('/moderation/risk-scores', { params: { page: 1, pageSize: 100 } });
    const items = res.data.data?.data ?? res.data.data ?? [];
    const byUser = new Map<string, any>();
    for (const item of items) {
      const current = byUser.get(item.userId);
      if (!current || item.riskScore > current.riskScore) byUser.set(item.userId, item);
    }
    return Array.from(byUser.values()).map(mapRisk);
  },
  reclassify: async (userId: string, newLevel: RiskScore['riskLevel']): Promise<void> => {
    await axios.patch(`/moderation/risk-scores/${userId}`, { riskLevel: newLevel });
  },
};
