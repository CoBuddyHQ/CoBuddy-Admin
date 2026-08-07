export interface FeaturedVenue {
  id: string;
  name: Record<string, string>;
  address: string;
  category: Record<string, string>;
  city: string;
  photoUrl: string;
  isActive: boolean;
}

export interface PlaceTypeConfig {
  id: string;
  typeName: string; // e.g. "cafe", "restaurant", "park"
  displayName: Record<string, string>; // e.g. "Café", "Restaurant", "Public Park"
  isAllowed: boolean;
}
