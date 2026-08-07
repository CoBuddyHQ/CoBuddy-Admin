export interface LiveSession {
  id: string;
  bookingId: string;
  companionId: string;
  customerId: string;
  companionName: string;
  customerName: string;
  startTime: string;
  expectedEndTime: string;
  status: 'ONGOING' | 'COMPLETED' | 'SOS_TRIGGERED';
  venue: string;
}
