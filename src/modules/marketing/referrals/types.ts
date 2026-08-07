export interface ReferralConfig {
  referrerRewardAmount: number;
  refereeRewardAmount: number;
  isActive: boolean;
}

export interface ReferralStat {
  userId: string;
  userName: string;
  totalReferrals: number;
  totalEarned: number;
}
