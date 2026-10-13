export interface TaxInvoice {
  id: string;
  companionId: string;
  companionName: string;
  panNumber: string;
  gstNumber?: string;
  period: string; // e.g. "October 2023"
  totalEarnings: number;
  tdsDeducted: number | null;
  gstCollected: number;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';
}
