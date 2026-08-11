// MOCK — replace with a real Google Places Autocomplete API call (Places API, type: 'sublocality'/'locality', biased to the selected city) during backend integration. Keep the same function signature so only this file needs to change.

const mockLocalities = [
  // Mumbai
  { name: 'Bandra West', city: 'CITY-1', lat: 19.0596, lng: 72.8295 },
  { name: 'Andheri East', city: 'CITY-1', lat: 19.1136, lng: 72.8697 },
  { name: 'Powai', city: 'CITY-1', lat: 19.1176, lng: 72.9060 },
  { name: 'Juhu', city: 'CITY-1', lat: 19.1075, lng: 72.8263 },
  { name: 'Colaba', city: 'CITY-1', lat: 18.9067, lng: 72.8147 },
  // Delhi
  { name: 'Connaught Place', city: 'CITY-2', lat: 28.6304, lng: 77.2177 },
  { name: 'Hauz Khas', city: 'CITY-2', lat: 28.5494, lng: 77.2001 },
  { name: 'Vasant Kunj', city: 'CITY-2', lat: 28.5293, lng: 77.1539 },
  { name: 'Karol Bagh', city: 'CITY-2', lat: 28.6517, lng: 77.1904 },
  { name: 'Saket', city: 'CITY-2', lat: 28.5245, lng: 77.2066 },
  // Bangalore
  { name: 'Indiranagar', city: 'CITY-3', lat: 12.9719, lng: 77.6412 },
  { name: 'Koramangala', city: 'CITY-3', lat: 12.9352, lng: 77.6245 },
  { name: 'Whitefield', city: 'CITY-3', lat: 12.9698, lng: 77.7499 },
  { name: 'Jayanagar', city: 'CITY-3', lat: 12.9299, lng: 77.5826 },
  { name: 'HSR Layout', city: 'CITY-3', lat: 12.9121, lng: 77.6446 }
];

export const searchAreaSuggestions = async (
  query: string,
  cityId: string
): Promise<{ name: string; lat: number; lng: number }[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!query.trim()) {
        resolve([]);
        return;
      }
      
      const q = query.toLowerCase();
      const results = mockLocalities
        .filter(loc => loc.city === cityId && loc.name.toLowerCase().includes(q))
        .slice(0, 5)
        .map(loc => ({ name: loc.name, lat: loc.lat, lng: loc.lng }));
        
      resolve(results);
    }, 400); // Simulate network latency
  });
};
