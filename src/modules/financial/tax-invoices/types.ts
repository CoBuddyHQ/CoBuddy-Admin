export interface TaxInvoice {
  id: string;
  companionId: string;
  companionName: string;
  panNumber: string;
  gstNumber?: string;
  period: string; // e.g. "October 2023"
  totalEarnings: number;
  tdsDeducted: number;
  gstCollected: number;
  status: 'PENDING' | 'GENERATED' | 'COMPLIANT';
}
