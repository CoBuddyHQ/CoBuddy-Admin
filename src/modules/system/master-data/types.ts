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
  serviceHoursOverride?: {
    openTime: string;
    closeTime: string;
  } | null;
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

export interface ReviewTagOption {
  id: string;
  code: string;
  label: Record<string, string>;
  polarity: 'PRAISE' | 'CONCERN';
  appliesTo: 'CUSTOMER_RATING_COMPANION' | 'COMPANION_RATING_CUSTOMER' | 'BOTH';
  active: boolean;
}

export interface DisputeReason {
  id: string;
  code: string;
  label: Record<string, string>;
  active: boolean;
}

export interface CancellationReason {
  id: string;
  code: string;
  label: Record<string, string>;
  appliesTo: 'CUSTOMER_CANCEL' | 'COMPANION_REJECT' | 'COMPANION_CANCEL' | 'COMPANION_EARLY_END' | 'ANY';
  active: boolean;
}

export interface KYCDocumentType {
  id: string;
  code: string;
  label: Record<string, string>;
  active: boolean;
}

export interface PlaceTypeConfig {
  id: string;
  typeName: string; // e.g. "cafe", "restaurant", "park"
  displayName: Record<string, string>; // e.g. "Café", "Restaurant", "Public Park"
  isAllowed: boolean;
}
