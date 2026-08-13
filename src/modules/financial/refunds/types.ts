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

export interface BookingSettings {
  minBookingDurationMins: number;
  maxBookingDurationMins: number;
  cancellationGracePeriodMins: number;
  autoCancelUnacceptedMins: number;
  cancellationRefundTiers: { id: string; noticeHoursMin: number; noticeHoursMax: number | null; refundPercent: number }[];
}
