export type ReconciliationMatchStatus = 'MATCHED' | 'MISMATCHED' | 'PENDING';

export interface ReconciliationRecord {
  id: string;
  internalLedgerId: string;
  internalTxnId?: string;
  gatewayTxnId?: string;
  amount: number;
  gatewayAmount?: number;
  gateway?: string;
  matchStatus: ReconciliationMatchStatus;
  reconciliationDate: string;
  mismatchNote?: string;
}
