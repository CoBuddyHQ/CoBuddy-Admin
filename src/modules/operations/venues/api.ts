import { FeaturedVenue } from './types';
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
  }
};
