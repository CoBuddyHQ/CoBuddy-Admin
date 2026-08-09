export type WebhookStatus = 'FAILED' | 'RECONCILED' | 'PENDING' | 'MISMATCH' | 'FLAGGED';

export interface ReconciliationRecord {
  id: string; // Razorpay Txn ID
  internalLedgerId: string;
  amount: number;
  razorpayAmount: number;
  status: WebhookStatus;
  date: string;
  errorMessage?: string;
}
