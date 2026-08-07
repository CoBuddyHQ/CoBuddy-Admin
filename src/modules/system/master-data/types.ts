export interface City {
  id: string;
  name: string;
  state: string;
  country: string;
  active: boolean;
}

export interface Interest {
  id: string;
  name: string;
  type: 'CUISINE' | 'ACTIVITY' | 'LIFESTYLE';
  icon?: string;
  active: boolean;
}

export interface Language {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface SystemDefaults {
  defaultCurrency: string;
  defaultLanguage: string;
}
