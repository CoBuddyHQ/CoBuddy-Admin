import { City, Interest, Language, AppLanguage, SystemDefaults, TicketCategory, IncidentType, CommunicationStyleOption, ActivityPaceOption, SessionDurationOption, NotificationCategoryOption, ReviewTagOption, DisputeReason, CancellationReason, KYCDocumentType } from './types';

// Note: Mobile apps should use systemConfig.serviceHours (from system/config/api.ts) to determine 
// the allowed time-range for bookings and availability. If a city has a serviceHoursOverride, 
// that should be used instead for any bookings/availability in that city.
// Effective hours = `city.serviceHoursOverride ?? systemConfig.serviceHours`.

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
  { 
    id: 'CITY-4', 
    name: { en: 'Pune', hi: 'पुणे' }, 
    state: 'Maharashtra', 
    country: 'India', 
    active: true,
    areas: [],
    serviceHoursOverride: {
      openTime: '08:00',
      closeTime: '20:00'
    }
  },
];

const interests: Interest[] = [
  { id: 'INT-1', name: { en: 'Italian', hi: 'इटालियन' }, type: 'CUISINE', basePriceMultiplier: 1.0, active: true },
  { id: 'INT-2', name: { en: 'Museums' }, type: 'ACTIVITY', basePriceMultiplier: 1.2, active: true }, // missing 'hi' on purpose
];

const languages: Language[] = [
  { id: 'LANG-1', code: 'HI', name: 'Hindi', active: true },
  { id: 'LANG-2', code: 'EN', name: 'English', active: true },
  { id: 'LANG-3', code: 'HING', name: 'Hinglish', active: true },
  { id: 'LANG-4', code: 'BN', name: 'Bengali', active: true },
  { id: 'LANG-5', code: 'MR', name: 'Marathi', active: true },
  { id: 'LANG-6', code: 'TE', name: 'Telugu', active: true },
  { id: 'LANG-7', code: 'TA', name: 'Tamil', active: true },
  { id: 'LANG-8', code: 'GU', name: 'Gujarati', active: true },
  { id: 'LANG-9', code: 'UR', name: 'Urdu', active: true },
  { id: 'LANG-10', code: 'KN', name: 'Kannada', active: true },
  { id: 'LANG-11', code: 'OR', name: 'Odia', active: true },
  { id: 'LANG-12', code: 'ML', name: 'Malayalam', active: true },
  { id: 'LANG-13', code: 'PA', name: 'Punjabi', active: true },
  { id: 'LANG-14', code: 'FR', name: 'French', active: true },
  { id: 'LANG-15', code: 'ES', name: 'Spanish', active: true },
];

const appLanguages: AppLanguage[] = [
  { id: 'ALANG-1', code: 'en', name: 'English', active: true },
  { id: 'ALANG-2', code: 'hi', name: 'Hindi', active: true },
  { id: 'ALANG-3', code: 'mr', name: 'Marathi', active: true },
  { id: 'ALANG-4', code: 'gu', name: 'Gujarati', active: true },
  { id: 'ALANG-5', code: 'bn', name: 'Bengali', active: true },
];

const ticketCategories: TicketCategory[] = [
  { id: 'TC-1', code: 'payment_payout', label: { en: 'Payment & Payout', hi: 'भुगतान' }, active: true },
  { id: 'TC-2', code: 'booking_session', label: { en: 'Booking & Session Issue', hi: 'बुकिंग समस्या' }, active: true },
  { id: 'TC-3', code: 'safety_incident', label: { en: 'Safety Concern', hi: 'सुरक्षा चिंता' }, active: true },
  { id: 'TC-4', code: 'verification', label: { en: 'Verification', hi: 'सत्यापन' }, active: true },
  { id: 'TC-5', code: 'account_access', label: { en: 'Account & Tech Support', hi: 'खाता सहायता' }, active: true },
  { id: 'TC-6', code: 'dispute', label: { en: 'Dispute', hi: 'विवाद' }, active: true },
  { id: 'TC-7', code: 'general', label: { en: 'General', hi: 'सामान्य' }, active: true }
];

const incidentTypes: IncidentType[] = [
  { id: 'IT-1', code: 'harassment', label: { en: 'Harassment', hi: 'उत्पीड़न' }, active: true },
  { id: 'IT-2', code: 'safety_concern', label: { en: 'Safety Concern', hi: 'सुरक्षा चिंता' }, active: true },
  { id: 'IT-3', code: 'no_show', label: { en: 'No Show', hi: 'कोई उपस्थिति नहीं' }, active: true },
  { id: 'IT-4', code: 'payment_dispute', label: { en: 'Payment Dispute', hi: 'भुगतान विवाद' }, active: true },
  { id: 'IT-5', code: 'inappropriate_behavior', label: { en: 'Inappropriate Behavior', hi: 'अनुचित व्यवहार' }, active: true },
  { id: 'IT-6', code: 'emergency', label: { en: 'Emergency', hi: 'आपातकाल' }, active: true },
  { id: 'IT-7', code: 'other', label: { en: 'Other', hi: 'अन्य' }, active: true }
];

const communicationStyles: CommunicationStyleOption[] = [
  { id: 'CS-1', code: 'chatty', label: { en: 'Chatty', hi: 'बातूनी' }, active: true },
  { id: 'CS-2', code: 'balanced', label: { en: 'Balanced', hi: 'संतुलित' }, active: true },
  { id: 'CS-3', code: 'comfortable_with_quiet', label: { en: 'Comfortable with quiet', hi: 'शांत वातावरण में सहज' }, active: true }
];

const activityPaces: ActivityPaceOption[] = [
  { id: 'AP-1', code: 'relaxed', label: { en: 'Relaxed', hi: 'आरामदायक' }, active: true },
  { id: 'AP-2', code: 'moderate', label: { en: 'Moderate', hi: 'मध्यम' }, active: true },
  { id: 'AP-3', code: 'active', label: { en: 'Active', hi: 'सक्रिय' }, active: true }
];

const sessionDurations: SessionDurationOption[] = [
  { id: 'SD-1', minutes: 60, label: { en: '1 Hour', hi: '1 घंटा' }, active: true },
  { id: 'SD-2', minutes: 90, label: { en: '1.5 Hours', hi: '1.5 घंटे' }, active: true },
  { id: 'SD-3', minutes: 120, label: { en: '2 Hours', hi: '2 घंटे' }, active: true },
  { id: 'SD-4', minutes: 180, label: { en: '3 Hours', hi: '3 घंटे' }, active: true }
];

const notificationCategories: NotificationCategoryOption[] = [
  { id: 'NC-1', code: 'request', label: { en: 'Request', hi: 'अनुरोध' }, active: true },
  { id: 'NC-2', code: 'session', label: { en: 'Session', hi: 'सत्र' }, active: true },
  { id: 'NC-3', code: 'safety', label: { en: 'Safety', hi: 'सुरक्षा' }, active: true },
  { id: 'NC-4', code: 'payout', label: { en: 'Payout', hi: 'भुगतान' }, active: true },
  { id: 'NC-5', code: 'support', label: { en: 'Support', hi: 'समर्थन' }, active: true },
  { id: 'NC-6', code: 'policy', label: { en: 'Policy', hi: 'नीति' }, active: true },
  { id: 'NC-7', code: 'training', label: { en: 'Training', hi: 'प्रशिक्षण' }, active: true },
  { id: 'NC-8', code: 'system', label: { en: 'System', hi: 'प्रणाली' }, active: true }
];

const reviewTags: ReviewTagOption[] = [
  { id: 'RT-1', code: 'friendly', label: { en: 'Friendly & Polite', hi: 'विनम्र' }, polarity: 'PRAISE', appliesTo: 'BOTH', active: true },
  { id: 'RT-2', code: 'punctual', label: { en: 'On Time', hi: 'समय पर' }, polarity: 'PRAISE', appliesTo: 'BOTH', active: true },
  { id: 'RT-3', code: 'late', label: { en: 'Arrived Late', hi: 'देर से आए' }, polarity: 'CONCERN', appliesTo: 'BOTH', active: true },
  { id: 'RT-4', code: 'inappropriate', label: { en: 'Inappropriate Behavior', hi: 'अनुचित व्यवहार' }, polarity: 'CONCERN', appliesTo: 'BOTH', active: true }
];

const disputeReasons: DisputeReason[] = [
  { id: 'DR-1', code: 'no_show', label: { en: 'Companion did not show up', hi: 'साथी नहीं आया' }, active: true },
  { id: 'DR-2', code: 'early_end', label: { en: 'Session ended much earlier', hi: 'सत्र बहुत पहले समाप्त हो गया' }, active: true },
  { id: 'DR-3', code: 'behavior', label: { en: 'Unprofessional behavior', hi: 'अव्यावसायिक व्यवहार' }, active: true }
];

const cancellationReasons: CancellationReason[] = [
  { id: 'CR-1', code: 'change_plans', label: { en: 'Plans changed', hi: 'योजनाएँ बदल गईं' }, appliesTo: 'CUSTOMER_CANCEL', active: true },
  { id: 'CR-2', code: 'emergency', label: { en: 'Personal emergency', hi: 'व्यक्तिगत आपातकाल' }, appliesTo: 'ANY', active: true },
  { id: 'CR-3', code: 'unreachable', label: { en: 'Could not reach other party', hi: 'संपर्क नहीं हो सका' }, appliesTo: 'ANY', active: true },
  { id: 'CR-4', code: 'uncomfortable', label: { en: 'Felt uncomfortable', hi: 'असहज महसूस किया' }, appliesTo: 'COMPANION_EARLY_END', active: true }
];

const kycDocumentTypes: KYCDocumentType[] = [
  { id: 'KYC-1', code: 'AADHAAR', label: { en: 'Aadhaar Card', hi: 'आधार कार्ड' }, active: true },
  { id: 'KYC-2', code: 'PAN', label: { en: 'PAN Card', hi: 'पैन कार्ड' }, active: true },
  { id: 'KYC-3', code: 'PASSPORT', label: { en: 'Passport', hi: 'पासपोर्ट' }, active: true },
  { id: 'KYC-4', code: 'DRIVING_LICENSE', label: { en: 'Driving License', hi: 'ड्राइविंग लाइसेंस' }, active: true }
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
  getTicketCategories: async (): Promise<TicketCategory[]> => Promise.resolve([...ticketCategories]),
  getIncidentTypes: async (): Promise<IncidentType[]> => Promise.resolve([...incidentTypes]),
  getCommunicationStyles: async (): Promise<CommunicationStyleOption[]> => Promise.resolve([...communicationStyles]),
  getActivityPaces: async (): Promise<ActivityPaceOption[]> => Promise.resolve([...activityPaces]),
  getSessionDurations: async (): Promise<SessionDurationOption[]> => Promise.resolve([...sessionDurations]),
  getNotificationCategories: async (): Promise<NotificationCategoryOption[]> => Promise.resolve([...notificationCategories]),
  getReviewTags: async (): Promise<ReviewTagOption[]> => Promise.resolve([...reviewTags]),
  getDisputeReasons: async (): Promise<DisputeReason[]> => Promise.resolve([...disputeReasons]),
  getCancellationReasons: async (): Promise<CancellationReason[]> => Promise.resolve([...cancellationReasons]),
  getKYCDocumentTypes: async (): Promise<KYCDocumentType[]> => Promise.resolve([...kycDocumentTypes]),

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
  toggleTicketCategory: async (id: string): Promise<void> => {
    const item = ticketCategories.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleIncidentType: async (id: string): Promise<void> => {
    const item = incidentTypes.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleCommunicationStyle: async (id: string): Promise<void> => {
    const item = communicationStyles.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleActivityPace: async (id: string): Promise<void> => {
    const item = activityPaces.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleSessionDuration: async (id: string): Promise<void> => {
    const item = sessionDurations.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleNotificationCategory: async (id: string): Promise<void> => {
    const item = notificationCategories.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleReviewTag: async (id: string): Promise<void> => {
    const item = reviewTags.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleDisputeReason: async (id: string): Promise<void> => {
    const item = disputeReasons.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleCancellationReason: async (id: string): Promise<void> => {
    const item = cancellationReasons.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleKYCDocumentType: async (id: string): Promise<void> => {
    const item = kycDocumentTypes.find(i => i.id === id);
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

  addTicketCategory: async (data: Omit<TicketCategory, 'id'>): Promise<void> => {
    ticketCategories.push({ id: `TC-${Date.now()}`, ...data });
    return Promise.resolve();
  },
  addIncidentType: async (data: Omit<IncidentType, 'id'>): Promise<void> => {
    incidentTypes.push({ id: `IT-${Date.now()}`, ...data });
    return Promise.resolve();
  },
  addCommunicationStyle: async (data: Omit<CommunicationStyleOption, 'id'>): Promise<void> => {
    communicationStyles.push({ id: `CS-${Date.now()}`, ...data });
    return Promise.resolve();
  },
  addActivityPace: async (data: Omit<ActivityPaceOption, 'id'>): Promise<void> => {
    activityPaces.push({ id: `AP-${Date.now()}`, ...data });
    return Promise.resolve();
  },
  addSessionDuration: async (data: Omit<SessionDurationOption, 'id'>): Promise<void> => {
    sessionDurations.push({ id: `SD-${Date.now()}`, ...data });
    return Promise.resolve();
  },
  addNotificationCategory: async (data: Omit<NotificationCategoryOption, 'id'>): Promise<void> => {
    notificationCategories.push({ id: `NC-${Date.now()}`, ...data });
    return Promise.resolve();
  },
  addReviewTag: async (data: Omit<ReviewTagOption, 'id'>): Promise<void> => {
    reviewTags.push({ id: `RT-${Date.now()}`, ...data });
    return Promise.resolve();
  },
  addDisputeReason: async (data: Omit<DisputeReason, 'id'>): Promise<void> => {
    disputeReasons.push({ id: `DR-${Date.now()}`, ...data });
    return Promise.resolve();
  },
  addCancellationReason: async (data: Omit<CancellationReason, 'id'>): Promise<void> => {
    cancellationReasons.push({ id: `CR-${Date.now()}`, ...data });
    return Promise.resolve();
  },
  addKYCDocumentType: async (data: Omit<KYCDocumentType, 'id'>): Promise<void> => {
    kycDocumentTypes.push({ id: `KYC-${Date.now()}`, ...data });
    return Promise.resolve();
  },

  addAreaToCity: async (cityId: string, areaName: Record<string, string>, lat?: number, lng?: number): Promise<void> => {
    const city = cities.find(c => c.id === cityId);
    if (city) {
      if (!city.areas) city.areas = [];
      city.areas.push({ id: `AREA-${Date.now()}`, name: areaName, active: true, lat, lng });
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
  updateCityServiceHours: async (cityId: string, hours: { openTime: string; closeTime: string } | null): Promise<void> => {
    const city = cities.find(c => c.id === cityId);
    if (city) {
      if (hours) {
        city.serviceHoursOverride = hours;
      } else {
        city.serviceHoursOverride = null;
      }
    }
    return Promise.resolve();
  },

  getDefaults: async (): Promise<SystemDefaults> => Promise.resolve({ ...mockDefaults }),
  updateDefaults: async (defaults: SystemDefaults): Promise<void> => {
    mockDefaults = { ...defaults };
    return Promise.resolve();
  }
};
