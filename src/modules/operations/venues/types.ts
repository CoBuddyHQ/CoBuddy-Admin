export interface FeaturedVenue {
  id: string;
  name: string;
  address: string;
  category: string;
  city: string;
  photoUrl: string;
  isActive: boolean;
}

export interface PlaceTypeConfig {
  id: string;
  typeName: string; // e.g. "cafe", "restaurant", "park"
  displayName: string; // e.g. "Café", "Restaurant", "Public Park"
  isAllowed: boolean;
}
