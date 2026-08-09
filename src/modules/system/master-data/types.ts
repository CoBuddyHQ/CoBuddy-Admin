export interface Area {
  id: string;
  name: Record<string, string>;
  active: boolean;
}

export interface City {
  id: string;
  name: Record<string, string>;
  state: string;
  country: string;
  active: boolean;
  areas?: Area[];
}

export interface Interest {
  id: string;
  name: Record<string, string>;
  type: 'CUISINE' | 'ACTIVITY' | 'LIFESTYLE';
  icon?: string;
  basePriceMultiplier?: number;
  active: boolean;
}

export interface Language {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface AppLanguage {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface SystemDefaults {
  defaultCurrency: string;
  defaultLanguage: string;
}
