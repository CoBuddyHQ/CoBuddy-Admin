import { UserRestriction } from './types';
import axios from '@/lib/api/client';

const durationMap: Record<string, string> = {
  TEMPORARY_24H: 'TEMP_BAN',
  TEMPORARY_7D: 'TEMP_BAN',
  TEMPORARY_30D: 'TEMP_BAN',
  PERMANENT: 'PERM_BAN',
};

const mapBan = (item: any): UserRestriction => ({
  userId: item.userId,
  userName: item.userId,
  userType: item.userType,
  restrictionType: (durationMap[item.duration] as UserRestriction['restrictionType']) ?? 'TEMP_BAN',
  reason: item.reason,
  appliedAt: item.startsAt || item.createdAt,
  expiresAt: item.endsAt ?? undefined,
  historyCount: 1,
});

export const bansApi = {
  getRestrictions: async (): Promise<UserRestriction[]> => {
    const res = await axios.get('/moderation/bans', { params: { page: 1, pageSize: 100 } });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return items.map(mapBan);
  },
  applyRestriction: async (payload: {
    userId: string;
    restrictionType: string;
    reason: string;
    durationDays?: number;
  }): Promise<void> => {
    const durationEnum =
      payload.restrictionType === 'PERM_BAN'
        ? 'PERMANENT'
        : payload.durationDays && payload.durationDays <= 1
          ? 'TEMPORARY_24H'
          : payload.durationDays && payload.durationDays <= 7
            ? 'TEMPORARY_7D'
            : 'TEMPORARY_30D';
    await axios.post('/moderation/bans', {
      userId: payload.userId,
      userType: 'CUSTOMER',
      reason: payload.reason,
      duration: durationEnum,
    });
  },
  liftRestriction: async (banId: string): Promise<void> => {
    await axios.patch(`/moderation/bans/${banId}/lift`, { reason: 'Lifted by admin' });
  },
};
