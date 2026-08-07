export interface BookingDispute {
  id: string;
  bookingId: string;
  customerId: string;
  companionId: string;
  raisedBy: 'CUSTOMER' | 'COMPANION';
  reason: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED_REFUND' | 'RESOLVED_NO_REFUND';
  amount: number;
  createdAt: string;
}
