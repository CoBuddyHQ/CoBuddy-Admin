export interface BookingDispute {
  id: string;
  version: number;
  bookingId: string;
  customerId: string;
  companionId: string;
  raisedBy: 'CUSTOMER' | 'COMPANION';
  reasonCode: string;
  reasonDetails?: string;
  status:
    | 'OPEN'
    | 'INVESTIGATING'
    | 'RESOLVED_REFUND'
    | 'RESOLVED_NO_REFUND'
    | 'ESCALATED'
    | 'REFUND_PENDING'
    | 'REFUND_REVIEW_REQUIRED';
  amount: number;
  refundAmount: number | null;
  refundPercent: number | null;
  overrideReason?: string;
  createdAt: string;
}
