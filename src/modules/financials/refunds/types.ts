export interface RefundRequest {
  id: string;
  bookingId: string;
  userId: string;
  userName: string;
  amount: number;
  reason: string;
  evidenceUrls: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  requestedAt: string;
}
