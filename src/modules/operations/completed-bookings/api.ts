import { CompletedBooking } from './types';

let mockCompleted: CompletedBooking[] = [
  { id: 'CB-101', sessionId: 'SESS-198', companionName: 'Alice', userName: 'John', durationMinutes: 120, totalCost: 4500, rating: 5, dateCompleted: new Date(Date.now() - 86400000).toISOString() },
  { id: 'CB-102', sessionId: 'SESS-199', companionName: 'Bob', userName: 'Jane', durationMinutes: 180, totalCost: 6500, rating: 4, dateCompleted: new Date(Date.now() - 172800000).toISOString() },
];

export const completedBookingsApi = {
  getBookings: async (): Promise<CompletedBooking[]> => Promise.resolve([...mockCompleted]),
};
