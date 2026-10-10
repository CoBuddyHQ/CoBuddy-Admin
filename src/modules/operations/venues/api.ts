import { unavailableFeature } from '@/lib/unavailable-feature';
import { FeaturedVenue } from './types';
export const venuesApi = {
  getFeaturedVenues: async (): Promise<FeaturedVenue[]> => {
    return unavailableFeature('operations/venues');
  },
  toggleVenueActive: async (_id: string): Promise<void> => {
    return unavailableFeature('operations/venues');
  },
  deleteVenue: async (_id: string): Promise<void> => {
    return unavailableFeature('operations/venues');
  },
  createFeaturedVenue: async (_data: Omit<FeaturedVenue, 'id' | 'isActive'>): Promise<void> => {
    return unavailableFeature('operations/venues');
  },
};
