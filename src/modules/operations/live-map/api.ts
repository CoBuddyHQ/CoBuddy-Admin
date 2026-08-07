import { LiveBookingMarker } from './types';

const mockMarkers: LiveBookingMarker[] = [
  { id: 'MK-1', sessionId: 'SESS-201', companionName: 'Alice', userName: 'John', latitude: 19.0760, longitude: 72.8777, status: 'IN_PROGRESS' },
  { id: 'MK-2', sessionId: 'SESS-202', companionName: 'Bob', userName: 'Jane', latitude: 19.1000, longitude: 72.9000, status: 'ARRIVING' },
  { id: 'MK-3', sessionId: 'SESS-203', companionName: 'Charlie', userName: 'Dave', latitude: 19.0500, longitude: 72.8500, status: 'EXTENDED' },
];

export const liveMapApi = {
  getLiveBookings: async (): Promise<LiveBookingMarker[]> => Promise.resolve(mockMarkers),
};
