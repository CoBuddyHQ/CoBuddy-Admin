import axios from '@/lib/api/client';
import { FeaturedVenue } from './types';
export const venuesApi = {
  getFeaturedVenues: async (): Promise<FeaturedVenue[]> => {
    return (await axios.get('/operations/venues')).data.data;
  },
  toggleVenueActive: async ({ id, active }: { id: string; active: boolean }): Promise<void> => {
    await axios.patch('/operations/venues/' + encodeURIComponent(id) + '/active', { active });
  },
  deleteVenue: async (id: string): Promise<void> => {
    await axios.delete('/operations/venues/' + encodeURIComponent(id) + '');
  },
  createFeaturedVenue: async (
    data: Omit<FeaturedVenue, 'id' | 'isActive' | 'cityName'>,
  ): Promise<void> => {
    await axios.post('/operations/venues', data);
  },
  updateFeaturedVenue: async ({
    id,
    data,
  }: {
    id: string;
    data: Omit<FeaturedVenue, 'id' | 'isActive' | 'cityName'>;
  }): Promise<void> => {
    await axios.put('/operations/venues/' + encodeURIComponent(id) + '', data);
  },
};
