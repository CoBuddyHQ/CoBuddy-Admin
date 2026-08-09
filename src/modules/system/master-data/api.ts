import { City, Interest, Language, AppLanguage, SystemDefaults } from './types';

const cities: City[] = [
  { 
    id: 'CITY-1', 
    name: { en: 'Mumbai', hi: 'मुंबई' }, 
    state: 'Maharashtra', 
    country: 'India', 
    active: true,
    areas: [
      { id: 'AREA-1', name: { en: 'Bandra', hi: 'बांद्रा' }, active: true },
      { id: 'AREA-2', name: { en: 'Andheri', hi: 'अंधेरी' }, active: true }
    ]
  },
  { 
    id: 'CITY-2', 
    name: { en: 'Delhi', hi: 'दिल्ली' }, 
    state: 'Delhi', 
    country: 'India', 
    active: true,
    areas: [] 
  },
  { 
    id: 'CITY-3', 
    name: { en: 'Bangalore' }, // missing 'hi' on purpose
    state: 'Karnataka', 
    country: 'India', 
    active: false,
    areas: []
  },
];

const interests: Interest[] = [
  { id: 'INT-1', name: { en: 'Italian', hi: 'इटालियन' }, type: 'CUISINE', basePriceMultiplier: 1.0, active: true },
  { id: 'INT-2', name: { en: 'Museums' }, type: 'ACTIVITY', basePriceMultiplier: 1.2, active: true }, // missing 'hi' on purpose
];

const languages: Language[] = [
  { id: 'LANG-1', code: 'EN', name: 'English', active: true },
  { id: 'LANG-2', code: 'HI', name: 'Hindi', active: true },
  { id: 'LANG-3', code: 'MR', name: 'Marathi', active: true },
];

const appLanguages: AppLanguage[] = [
  { id: 'ALANG-1', code: 'en', name: 'English', active: true },
  { id: 'ALANG-2', code: 'hi', name: 'Hindi', active: true },
];

let mockDefaults: SystemDefaults = {
  defaultCurrency: 'INR',
  defaultLanguage: 'en',
};

export const masterDataApi = {
  getCities: async (): Promise<City[]> => Promise.resolve([...cities]),
  getInterests: async (): Promise<Interest[]> => Promise.resolve([...interests]),
  getLanguages: async (): Promise<Language[]> => Promise.resolve([...languages]),
  getAppLanguages: async (): Promise<AppLanguage[]> => Promise.resolve([...appLanguages]),

  toggleCity: async (id: string): Promise<void> => {
    const item = cities.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleInterest: async (id: string): Promise<void> => {
    const item = interests.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleLanguage: async (id: string): Promise<void> => {
    const item = languages.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleAppLanguage: async (id: string): Promise<void> => {
    const item = appLanguages.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  updateInterestMultiplier: async (id: string, multiplier: number): Promise<void> => {
    const item = interests.find(i => i.id === id);
    if (item) item.basePriceMultiplier = multiplier;
    return Promise.resolve();
  },

  addCity: async (data: Omit<City, 'id'>): Promise<void> => {
    cities.push({ id: `CITY-${Date.now()}`, ...data, areas: [] });
    return Promise.resolve();
  },
  addInterest: async (data: Omit<Interest, 'id'>): Promise<void> => {
    interests.push({ id: `INT-${Date.now()}`, ...data });
    return Promise.resolve();
  },
  addLanguage: async (data: Omit<Language, 'id'>): Promise<void> => {
    languages.push({ id: `LANG-${Date.now()}`, ...data });
    return Promise.resolve();
  },
  addAppLanguage: async (data: Omit<AppLanguage, 'id'>): Promise<void> => {
    appLanguages.push({ id: `ALANG-${Date.now()}`, ...data });
    return Promise.resolve();
  },

  addAreaToCity: async (cityId: string, areaName: Record<string, string>): Promise<void> => {
    const city = cities.find(c => c.id === cityId);
    if (city) {
      if (!city.areas) city.areas = [];
      city.areas.push({ id: `AREA-${Date.now()}`, name: areaName, active: true });
    }
    return Promise.resolve();
  },
  toggleArea: async (cityId: string, areaId: string): Promise<void> => {
    const city = cities.find(c => c.id === cityId);
    if (city && city.areas) {
      const area = city.areas.find(a => a.id === areaId);
      if (area) area.active = !area.active;
    }
    return Promise.resolve();
  },

  getDefaults: async (): Promise<SystemDefaults> => Promise.resolve({ ...mockDefaults }),
  updateDefaults: async (defaults: SystemDefaults): Promise<void> => {
    mockDefaults = { ...defaults };
    return Promise.resolve();
  }
};
