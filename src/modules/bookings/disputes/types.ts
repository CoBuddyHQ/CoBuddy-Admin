export interface BookingDispute {
  id: string;
  bookingId: string;
  customerId: string;
  companionId: string;
  raisedBy: 'CUSTOMER' | 'COMPANION';
  reasonCode: string;
  reasonDetails?: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED_REFUND' | 'RESOLVED_NO_REFUND' | 'ESCALATED';
  amount: number;
  noticeGivenHours: number;
  calculatedPenaltyPercent: number;
  overrideReason?: string;
  createdAt: string;
}
