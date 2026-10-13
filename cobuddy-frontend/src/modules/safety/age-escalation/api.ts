import axios from '@/lib/api/client';
import { AgeEscalationCase } from './types';

export const ageEscalationApi = {
  getCases: async (): Promise<AgeEscalationCase[]> => {
    const response = await axios.get('/safety/age-escalations');
    const rows = response.data.data?.data ?? response.data.data ?? [];
    return rows.map((item: any) => ({
      id: item.id,
      userId: item.userId,
      userName: item.userName,
      dobMismatchDetails: item.dobMismatchDetails,
      idEstimate: item.idEstimate,
      selfieEstimate: item.selfieEstimate,
      associatedRecordLink: item.associatedRecordLink,
      status: item.status,
      timestamp: item.timestamp,
      resolutionNote: item.reviewNote ?? undefined,
    }));
  },
  updateStatus: async (
    id: string,
    status: AgeEscalationCase['status'],
    resolutionNote?: string,
  ): Promise<void> => {
    await axios.patch('/safety/age-escalations/' + id + '/status', { status, resolutionNote });
  },
};
