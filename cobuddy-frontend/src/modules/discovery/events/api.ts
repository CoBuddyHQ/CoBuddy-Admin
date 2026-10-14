import axios from '@/lib/api/client';
import { SpecialEvent } from './types';
export const eventsApi = {
  getEvents: async (): Promise<SpecialEvent[]> => {
    return (await axios.get('/discovery/events')).data.data;
  },
  createEvent: async (event: Omit<SpecialEvent, 'id' | 'isActive'>): Promise<void> => {
    await axios.post('/discovery/events', event);
  },
  toggleEvent: async ({ id, active }: { id: string; active: boolean }): Promise<void> => {
    await axios.patch('/discovery/events/' + encodeURIComponent(id) + '/active', { active });
  },
};
