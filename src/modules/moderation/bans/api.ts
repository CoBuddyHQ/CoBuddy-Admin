import { UserRestriction } from './types';

let mockRestrictions: UserRestriction[] = [
  { userId: 'UserA', userName: 'Alice', userType: 'CUSTOMER', restrictionType: 'WARNING', reason: 'Spamming chat', appliedAt: new Date().toISOString(), historyCount: 1 },
  { userId: 'CompB', userName: 'Bob', userType: 'COMPANION', restrictionType: 'PERM_BAN', reason: 'Severe policy violation', appliedAt: new Date(Date.now() - 86400000).toISOString(), historyCount: 3 },
];

export const bansApi = {
  getRestrictions: async (): Promise<UserRestriction[]> => Promise.resolve([...mockRestrictions]),
  applyRestriction: async (payload: { userId: string, restrictionType: string, reason: string, durationDays?: number }): Promise<void> => {
    // In real app, this would also forcefully logout all active sessions for this user.
    mockRestrictions.unshift({
      userId: payload.userId,
      userName: 'Unknown User', // mock
      userType: 'CUSTOMER',
      restrictionType: payload.restrictionType as any,
      reason: payload.reason,
      appliedAt: new Date().toISOString(),
      expiresAt: payload.durationDays ? new Date(Date.now() + payload.durationDays * 86400000).toISOString() : undefined,
      historyCount: 1
    });
    return Promise.resolve();
  },
  liftRestriction: async (userId: string): Promise<void> => {
    mockRestrictions = mockRestrictions.filter(r => r.userId !== userId);
    return Promise.resolve();
  }
};
