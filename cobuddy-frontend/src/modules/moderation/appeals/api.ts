import { AppealItem } from './types';
import axios from '@/lib/api/client';

const mapAppeal = (item: any): AppealItem => ({
  id: item.id,
  userId: item.banId,
  userName: item.banId,
  originalBanReason: item.appealReason,
  appealStatement: item.appealReason,
  status: item.status === 'OPEN' ? 'PENDING' : item.status,
  submittedAt: item.createdAt,
});

export const appealsApi = {
  getAppeals: async (): Promise<AppealItem[]> => {
    const res = await axios.get('/moderation/appeals', { params: { page: 1, pageSize: 100 } });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return items.map(mapAppeal);
  },
  resolveAppeal: async (
    id: string,
    action: 'UPHELD' | 'REVERSED' | 'REDUCED_TO_WARNING',
  ): Promise<void> => {
    const statusMap: Record<string, string> = {
      UPHELD: 'REJECTED',
      REVERSED: 'APPROVED',
      REDUCED_TO_WARNING: 'APPROVED',
    };
    await axios.patch(`/moderation/appeals/${id}/status`, {
      status: statusMap[action],
      reviewNote: action,
    });
  },
};
