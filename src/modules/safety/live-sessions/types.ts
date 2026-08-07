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
  timerStatus: 'ON_TRACK' | 'RUNNING_LATE' | 'OVERDUE';
  gpsLocation: { lat: number; lng: number };
  checkInStatus: 'CHECKED_IN' | 'NOT_YET' | 'MISSED';
}
