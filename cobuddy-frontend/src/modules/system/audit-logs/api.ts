import axios from '@/lib/api/client';
import { AuditLog } from './types';

export const auditLogsApi = {
  getLogs: async (): Promise<AuditLog[]> => {
    const response = await axios.get('/audit-logs', { params: { page: 1, pageSize: 100 } });
    const items = response.data.data?.data ?? response.data.data ?? [];
    return items.map((item: any) => ({
      id: item.id,
      adminId: item.adminId,
      adminName: item.adminName,
      action: item.action,
      moduleAffected: item.moduleAffected,
      details: item.details ?? '',
      ipAddress: item.ipAddress ?? '',
      timestamp: item.timestamp,
    }));
  },
};
