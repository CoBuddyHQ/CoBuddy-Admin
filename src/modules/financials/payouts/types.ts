export interface PayoutItem {
  id: string;
  companionId: string;
  companionName: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'ON_HOLD';
  dueDate: string;
}
