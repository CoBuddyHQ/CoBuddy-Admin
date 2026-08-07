export interface BookingSettings {
  minBookingDurationMins: number;
  maxBookingDurationMins: number;
  cancellationGracePeriodMins: number;
  autoCancelUnacceptedMins: number;
}
