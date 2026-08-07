import { ReferralConfig, ReferralStat } from './types';

let mockConfig: ReferralConfig = {
  referrerRewardAmount: 500,
  refereeRewardAmount: 250,
  isActive: true,
};

let mockStats: ReferralStat[] = [
  { userId: 'UserA', userName: 'Alice', totalReferrals: 12, totalEarned: 6000 },
  { userId: 'CompB', userName: 'Bob', totalReferrals: 5, totalEarned: 2500 },
];

export const referralsApi = {
  getConfig: async (): Promise<ReferralConfig> => Promise.resolve({ ...mockConfig }),
  updateConfig: async (config: ReferralConfig): Promise<void> => {
    mockConfig = { ...config };
    return Promise.resolve();
  },
  getLeaderboard: async (): Promise<ReferralStat[]> => Promise.resolve([...mockStats]),
};
