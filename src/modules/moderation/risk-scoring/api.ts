import { RiskScore } from './types';

const mockRiskScores: RiskScore[] = [
  { userId: 'User100', userName: 'John Doe', userType: 'CUSTOMER', riskLevel: 'HIGH', deviceFlags: 2, gpsSpoofFlags: 5, duplicateAccountSignals: 1, lastUpdated: new Date().toISOString() },
  { userId: 'Comp200', userName: 'Jane Smith', userType: 'COMPANION', riskLevel: 'LOW', deviceFlags: 0, gpsSpoofFlags: 0, duplicateAccountSignals: 0, lastUpdated: new Date(Date.now() - 3600000).toISOString() },
  { userId: 'User101', userName: 'Test User', userType: 'CUSTOMER', riskLevel: 'CRITICAL', deviceFlags: 4, gpsSpoofFlags: 12, duplicateAccountSignals: 3, lastUpdated: new Date().toISOString() },
];

export const riskScoringApi = {
  getScores: async (): Promise<RiskScore[]> => Promise.resolve([...mockRiskScores]),
  reclassify: async (userId: string, newLevel: RiskScore['riskLevel']): Promise<void> => {
    const score = mockRiskScores.find(s => s.userId === userId);
    if (score) {
      score.riskLevel = newLevel;
      score.lastUpdated = new Date().toISOString();
    }
    return Promise.resolve();
  }
};
