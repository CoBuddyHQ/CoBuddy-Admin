import axios from '@/lib/api/client';
import { ReconciliationMatchStatus, ReconciliationRecord } from './types';

const mapRecord = (item: any): ReconciliationRecord => ({
  id: item.id,
  internalLedgerId: item.internalTxnId ?? '',
  internalTxnId: item.internalTxnId ?? undefined,
  gatewayTxnId: item.gatewayTxnId ?? undefined,
  amount: Number(item.internalAmount ?? 0),
  gatewayAmount: item.gatewayAmount == null ? undefined : Number(item.gatewayAmount),
  gateway: item.gateway,
  matchStatus: item.matchStatus,
  reconciliationDate: item.reconciliationDate,
  mismatchNote: item.mismatchNote ?? undefined,
});

export const reconciliationApi = {
  getRecords: async (): Promise<ReconciliationRecord[]> => {
    const response = await axios.get('/financial/reconciliation', {
      params: { page: 1, pageSize: 100 },
    });
    const items = response.data.data?.data ?? response.data.data ?? [];
    return items.map(mapRecord);
  },
  updateStatus: async (
    id: string,
    matchStatus: Exclude<ReconciliationMatchStatus, 'PENDING'>,
  ): Promise<void> => {
    await axios.post('/financial/reconciliation/' + id + '/resolve', { matchStatus });
  },
};
