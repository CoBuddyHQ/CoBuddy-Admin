import axios from '@/lib/api/client';
import { FraudAlert } from './types';

const mapAlert = (item: any): FraudAlert => ({
  id: item.id,
  userId: item.userId,
  userName: item.userId,
  userType: item.userType,
  reason: item.category,
  severity:
    item.riskScore >= 80
      ? 'CRITICAL'
      : item.riskScore >= 60
        ? 'HIGH'
        : item.riskScore >= 30
          ? 'MEDIUM'
          : 'LOW',
  status: item.status,
  timestamp: item.createdAt,
  details: item.description,
});

export const fraudApi = {
  getAlerts: async (): Promise<FraudAlert[]> => {
    const response = await axios.get('/financial/fraud-detection', {
      params: { page: 1, pageSize: 100 },
    });
    const items = response.data.data?.data ?? response.data.data ?? [];
    return items.map(mapAlert);
  },
  updateAlertStatus: async (id: string, status: FraudAlert['status']): Promise<void> => {
    await axios.patch('/financial/fraud-detection/' + id, { status });
  },
};
