export interface CompletedBooking {
  id: string;
  sessionId: string;
  companionName: string;
  userName: string;
  durationMinutes: number;
  totalCost: number;
  rating: number | null; // 0-5
  dateCompleted: string;
}
