export interface CancelledBooking {
  id: string;
  sessionId: string;
  companionName: string;
  userName: string;
  cancelledBy: 'CUSTOMER' | 'COMPANION' | 'SYSTEM';
  reason: string;
  penaltyApplied: number;
  refundAmount: number;
  dateCancelled: string;
}
