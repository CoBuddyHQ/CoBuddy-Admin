import { CancelledBooking } from './types';

const mockCancelled: CancelledBooking[] = [
  { id: 'CB-201', sessionId: 'SESS-195', companionName: 'Alice', userName: 'John', cancelledBy: 'CUSTOMER', reason: 'Change of plans', penaltyApplied: 500, refundAmount: 2000, dateCancelled: new Date(Date.now() - 43200000).toISOString() },
  { id: 'CB-202', sessionId: 'SESS-190', companionName: 'Bob', userName: 'Jane', cancelledBy: 'COMPANION', reason: 'Emergency', penaltyApplied: 1000, refundAmount: 3000, dateCancelled: new Date(Date.now() - 86400000).toISOString() },
];

export const cancelledBookingsApi = {
  getBookings: async (): Promise<CancelledBooking[]> => Promise.resolve([...mockCancelled]),
};
