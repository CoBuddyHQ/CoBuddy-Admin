export interface Area {
  id: string;
  name: Record<string, string>;
  active: boolean;
  lat?: number;
  lng?: number;
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

export interface TicketCategory {
  id: string;
  code: string;
  label: Record<string, string>;
  active: boolean;
}

export interface IncidentType {
  id: string;
  code: string;
  label: Record<string, string>;
  active: boolean;
}

export interface CommunicationStyleOption {
  id: string;
  code: string;
  label: Record<string, string>;
  active: boolean;
}

export interface ActivityPaceOption {
  id: string;
  code: string;
  label: Record<string, string>;
  active: boolean;
}

export interface SessionDurationOption {
  id: string;
  minutes: number;
  label: Record<string, string>;
  active: boolean;
}

export interface NotificationCategoryOption {
  id: string;
  code: string;
  label: Record<string, string>;
  active: boolean;
}
