import { unavailableFeature } from '@/lib/unavailable-feature';
import { SpecialEvent } from './types';
export const eventsApi = {
  getEvents: async (): Promise<SpecialEvent[]> => {
    return unavailableFeature('discovery/events');
  },
  createEvent: async (_event: Omit<SpecialEvent, 'id' | 'isActive'>): Promise<void> => {
    return unavailableFeature('discovery/events');
  },
  toggleEvent: async (_id: string): Promise<void> => {
    return unavailableFeature('discovery/events');
  },
};
