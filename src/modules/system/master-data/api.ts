import { City, Interest, Language, SystemDefaults } from './types';

const cities: City[] = [
  { id: 'CITY-1', name: 'Mumbai', state: 'Maharashtra', country: 'India', active: true },
  { id: 'CITY-2', name: 'Delhi', state: 'Delhi', country: 'India', active: true },
  { id: 'CITY-3', name: 'Bangalore', state: 'Karnataka', country: 'India', active: false },
];

const interests: Interest[] = [
  { id: 'INT-1', name: 'Italian', type: 'CUISINE', active: true },
  { id: 'INT-2', name: 'Museums', type: 'ACTIVITY', active: true },
];

const languages: Language[] = [
  { id: 'LANG-1', code: 'EN', name: 'English', active: true },
  { id: 'LANG-2', code: 'HI', name: 'Hindi', active: true },
];

let mockDefaults: SystemDefaults = {
  defaultCurrency: 'INR',
  defaultLanguage: 'English',
};

export const masterDataApi = {
  getCities: async (): Promise<City[]> => Promise.resolve([...cities]),
  getInterests: async (): Promise<Interest[]> => Promise.resolve([...interests]),
  getLanguages: async (): Promise<Language[]> => Promise.resolve([...languages]),

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

  addCity: async (data: Omit<City, 'id'>): Promise<void> => {
    cities.push({ id: `CITY-${Date.now()}`, ...data });
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

  getDefaults: async (): Promise<SystemDefaults> => Promise.resolve({ ...mockDefaults }),
  updateDefaults: async (defaults: SystemDefaults): Promise<void> => {
    mockDefaults = { ...defaults };
    return Promise.resolve();
  }
};
