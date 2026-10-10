import axios from '@/lib/api/client';
import { EmergencyWorkflow } from './types';

export const emergencyWorkflowApi = {
  getWorkflows: async (): Promise<EmergencyWorkflow[]> => {
    const response = await axios.get('/safety/emergency-workflows');
    const rows = response.data.data?.data ?? response.data.data ?? [];
    return rows.map((item: any) => ({
      id: item.id,
      sosAlertId: item.sosAlertId,
      status: item.status,
      createdAt: item.createdAt,
      log: item.log ?? [],
    }));
  },
  advanceStep: async (
    id: string,
    newStatus: EmergencyWorkflow['status'],
    actionDetail: string,
    _handler: string,
  ): Promise<void> => {
    await axios.patch('/safety/emergency-workflows/' + id + '/status', {
      status: newStatus,
      actionDetail,
    });
  },
};
