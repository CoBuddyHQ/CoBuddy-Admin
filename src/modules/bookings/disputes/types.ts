export interface BookingDispute {
  id: string;
  bookingId: string;
  customerId: string;
  companionId: string;
  raisedBy: 'CUSTOMER' | 'COMPANION';
  reason: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED_REFUND' | 'RESOLVED_NO_REFUND' | 'ESCALATED';
  amount: number;
  noticeGivenHours: number;
  calculatedPenaltyPercent: number;
  overrideReason?: string;
  createdAt: string;
}
