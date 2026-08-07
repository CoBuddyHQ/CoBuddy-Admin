import { SpecialEvent } from './types';

const mockEvents: SpecialEvent[] = [
  { id: 'EVT-1', title: 'Valentine\'s Week Special', description: 'Highlight companions offering dinner dates.', linkedCategory: 'Dinner Dates', startDate: new Date(Date.now() - 86400000).toISOString(), endDate: new Date(Date.now() + 864000000).toISOString(), isActive: true },
  { id: 'EVT-2', title: 'New Year Bash', description: 'Party companions in top cities.', linkedCategory: 'Party', startDate: new Date(Date.now() - 31536000000).toISOString(), endDate: new Date(Date.now() - 31449600000).toISOString(), isActive: false },
];

export const eventsApi = {
  getEvents: async (): Promise<SpecialEvent[]> => Promise.resolve([...mockEvents]),
  createEvent: async (event: Omit<SpecialEvent, 'id' | 'isActive'>): Promise<void> => {
    mockEvents.unshift({
      ...event,
      id: `EVT-${Math.floor(Math.random() * 1000)}`,
      isActive: true
    });
    return Promise.resolve();
  },
  toggleEvent: async (id: string): Promise<void> => {
    const e = mockEvents.find(x => x.id === id);
    if (e) {
      e.isActive = !e.isActive;
    }
    return Promise.resolve();
  }
};
