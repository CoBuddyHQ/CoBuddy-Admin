export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'ON_HOLD';

export interface PayoutItem {
  id: string;
  payoutRef: string;
  companionId: string;
  companion?: { id: string; name: string };
  amount: string;
  periodStart: string;
  periodEnd: string;
  status: PayoutStatus;
  dueDate: string;
  holdReason: string | null;
  failureMessage: string | null;
  utrNumber: string | null;
  bankAccount: { accountLast4: string; upiId: string | null; verified: boolean } | null;
}

export interface PayoutPage {
  data: PayoutItem[];
  meta: { page: number; totalPages: number; totalItems: number; hasNext: boolean };
}

export type PayoutAction = { id: string } & (
  | { action: 'hold' | 'mark-failed'; reason: string }
  | { action: 'mark-paid'; utrNumber: string }
  | { action: 'process' | 'lift-hold' }
);
