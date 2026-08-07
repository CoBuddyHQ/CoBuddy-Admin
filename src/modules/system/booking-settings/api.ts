import { BookingSettings } from './types';

let mockSettings: BookingSettings = {
  minBookingDurationMins: 60,
  maxBookingDurationMins: 480,
  cancellationGracePeriodMins: 15,
  autoCancelUnacceptedMins: 10,
};

export const bookingSettingsApi = {
  getSettings: async (): Promise<BookingSettings> => Promise.resolve({ ...mockSettings }),
  updateSettings: async (settings: BookingSettings): Promise<void> => {
    mockSettings = { ...settings };
    return Promise.resolve();
  }
};
