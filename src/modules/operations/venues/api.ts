import { FeaturedVenue, PlaceTypeConfig } from './types';

let mockVenues: FeaturedVenue[] = [
  {
    id: 'VEN-001',
    name: { en: 'Blue Tokai Coffee Roasters', hi: 'ब्लू टोकाई कॉफी रोस्टर्स' },
    address: 'Koregaon Park, Pune',
    category: { en: 'Café', hi: 'कैफे' },
    city: 'Pune',
    photoUrl: 'https://via.placeholder.com/150',
    isActive: true
  },
  {
    id: 'VEN-002',
    name: { en: 'Phoenix Mall', hi: 'फीनिक्स मॉल' },
    address: 'Viman Nagar, Pune',
    category: { en: 'Shopping Mall', hi: 'शॉपिंग मॉल' },
    city: 'Pune',
    photoUrl: 'https://via.placeholder.com/150',
    isActive: true
  }
];

let mockPlaceTypes: PlaceTypeConfig[] = [
  { id: 'PT-1', typeName: 'cafe', displayName: { en: 'Café', hi: 'कैफे' }, isAllowed: true },
  { id: 'PT-2', typeName: 'restaurant', displayName: { en: 'Restaurant', hi: 'भोजनालय' }, isAllowed: true },
  { id: 'PT-3', typeName: 'park', displayName: { en: 'Public Park', hi: 'सार्वजनिक पार्क' }, isAllowed: true },
  { id: 'PT-4', typeName: 'museum', displayName: { en: 'Gallery/Museum', hi: 'संग्रहालय' }, isAllowed: true },
  { id: 'PT-5', typeName: 'book_store', displayName: { en: 'Bookstore', hi: 'किताबों की दुकान' }, isAllowed: true },
  { id: 'PT-6', typeName: 'shopping_mall', displayName: { en: 'Shopping Mall', hi: 'शॉपिंग मॉल' }, isAllowed: true },
  { id: 'PT-7', typeName: 'lodging', displayName: { en: 'Hotel/Lodging', hi: 'होटल' }, isAllowed: false },
  { id: 'PT-8', typeName: 'bar', displayName: { en: 'Bar/Pub', hi: 'बार' }, isAllowed: false },
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

  createFeaturedVenue: async (data: Omit<FeaturedVenue, 'id' | 'isActive'>): Promise<void> => {
    const newVenue: FeaturedVenue = {
      ...data,
      id: `VEN-00${mockVenues.length + 1}`,
      isActive: true
    };
    mockVenues = [newVenue, ...mockVenues];
  },

  getPlaceTypes: async (): Promise<PlaceTypeConfig[]> => {
    return [...mockPlaceTypes];
  },

  togglePlaceTypeAllowed: async (id: string): Promise<void> => {
    mockPlaceTypes = mockPlaceTypes.map(p => p.id === id ? { ...p, isAllowed: !p.isAllowed } : p);
  }
};
