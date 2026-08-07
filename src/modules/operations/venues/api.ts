import { FeaturedVenue, PlaceTypeConfig } from './types';

let mockVenues: FeaturedVenue[] = [
  {
    id: 'VEN-001',
    name: 'Blue Tokai Coffee Roasters',
    address: 'Koregaon Park, Pune',
    category: 'Café',
    city: 'Pune',
    photoUrl: 'https://via.placeholder.com/150',
    isActive: true
  },
  {
    id: 'VEN-002',
    name: 'Phoenix Mall',
    address: 'Viman Nagar, Pune',
    category: 'Shopping Mall',
    city: 'Pune',
    photoUrl: 'https://via.placeholder.com/150',
    isActive: true
  }
];

let mockPlaceTypes: PlaceTypeConfig[] = [
  { id: 'PT-1', typeName: 'cafe', displayName: 'Café', isAllowed: true },
  { id: 'PT-2', typeName: 'restaurant', displayName: 'Restaurant', isAllowed: true },
  { id: 'PT-3', typeName: 'park', displayName: 'Public Park', isAllowed: true },
  { id: 'PT-4', typeName: 'museum', displayName: 'Gallery/Museum', isAllowed: true },
  { id: 'PT-5', typeName: 'book_store', displayName: 'Bookstore', isAllowed: true },
  { id: 'PT-6', typeName: 'shopping_mall', displayName: 'Shopping Mall', isAllowed: true },
  { id: 'PT-7', typeName: 'lodging', displayName: 'Hotel/Lodging', isAllowed: false },
  { id: 'PT-8', typeName: 'bar', displayName: 'Bar/Pub', isAllowed: false },
];

export const venuesApi = {
  getFeaturedVenues: async (): Promise<FeaturedVenue[]> => {
    return [...mockVenues];
  },
  
  toggleVenueActive: async (id: string): Promise<void> => {
    mockVenues = mockVenues.map(v => v.id === id ? { ...v, isActive: !v.isActive } : v);
  },

  deleteVenue: async (id: string): Promise<void> => {
    mockVenues = mockVenues.filter(v => v.id !== id);
  },

  getPlaceTypes: async (): Promise<PlaceTypeConfig[]> => {
    return [...mockPlaceTypes];
  },

  togglePlaceTypeAllowed: async (id: string): Promise<void> => {
    mockPlaceTypes = mockPlaceTypes.map(p => p.id === id ? { ...p, isAllowed: !p.isAllowed } : p);
  }
};
