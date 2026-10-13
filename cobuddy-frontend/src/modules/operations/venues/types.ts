export interface FeaturedVenue {
  id: string;
  name: Record<string, string>;
  address: string;
  category: Record<string, string>;
  city: string;
  cityName?: string;
  latitude: number;
  longitude: number;
  photoUrl: string;
  isActive: boolean;
}
