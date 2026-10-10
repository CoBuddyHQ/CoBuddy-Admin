import axios from '@/lib/api/client';
import {
  ActivityPaceOption,
  AppLanguage,
  CancellationReason,
  City,
  CommunicationStyleOption,
  DisputeReason,
  IncidentType,
  Interest,
  KYCDocumentType,
  Language,
  NotificationCategoryOption,
  PlaceTypeConfig,
  ReviewTagOption,
  SessionDurationOption,
  SystemDefaults,
  TicketCategory,
} from './types';

const rows = async <T>(path: string, params?: Record<string, unknown>): Promise<T[]> => {
  const response = await axios.get(path, { params });
  const value = response.data.data;
  return Array.isArray(value) ? value : (value?.data ?? []);
};
const create = async (path: string, data: unknown): Promise<void> => {
  await axios.post(path, data);
};
const toggle = async (path: string, id: string): Promise<void> => {
  await axios.patch(path + '/' + id + '/toggle');
};

const cityCode = (data: Omit<City, 'id'>) => {
  const label = data.name.en || data.name.hi || data.state;
  return String(label)
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase();
};

export const masterDataApi = {
  getCities: async (): Promise<City[]> => {
    const cities = await rows<any>('/master-data/cities', {
      page: 1,
      pageSize: 200,
      include: 'areas',
    });
    return cities.map((city) => ({
      ...city,
      areas: city.areas ?? [],
      serviceHoursOverride:
        city.serviceHoursOpen || city.serviceHoursClose
          ? { openTime: city.serviceHoursOpen ?? '', closeTime: city.serviceHoursClose ?? '' }
          : null,
    }));
  },
  getInterests: () => rows<Interest>('/master-data/interests', { page: 1, pageSize: 200 }),
  getLanguages: () => rows<Language>('/master-data/languages', { page: 1, pageSize: 200 }),
  getAppLanguages: () =>
    rows<AppLanguage>('/master-data/app-languages', { page: 1, pageSize: 200 }),
  getTicketCategories: () =>
    rows<TicketCategory>('/master-data/ticket-categories', { page: 1, pageSize: 200 }),
  getIncidentTypes: () =>
    rows<IncidentType>('/master-data/incident-types', { page: 1, pageSize: 200 }),
  getCommunicationStyles: () =>
    rows<CommunicationStyleOption>('/master-data/communication-styles', { page: 1, pageSize: 200 }),
  getActivityPaces: () =>
    rows<ActivityPaceOption>('/master-data/activity-paces', { page: 1, pageSize: 200 }),
  getSessionDurations: () =>
    rows<SessionDurationOption>('/master-data/session-durations', { page: 1, pageSize: 200 }),
  getNotificationCategories: () =>
    rows<NotificationCategoryOption>('/master-data/notification-categories', {
      page: 1,
      pageSize: 200,
    }),
  getReviewTags: () =>
    rows<ReviewTagOption>('/master-data/review-tags', { page: 1, pageSize: 200 }),
  getDisputeReasons: () =>
    rows<DisputeReason>('/master-data/dispute-reasons', { page: 1, pageSize: 200 }),
  getCancellationReasons: () =>
    rows<CancellationReason>('/master-data/cancellation-reasons', { page: 1, pageSize: 200 }),
  getKYCDocumentTypes: () =>
    rows<KYCDocumentType>('/master-data/kyc-doc-types', { page: 1, pageSize: 200 }),
  getPlaceTypes: () =>
    rows<PlaceTypeConfig>('/master-data/place-types', { page: 1, pageSize: 200 }),

  toggleCity: (id: string) => toggle('/master-data/cities', id),
  toggleInterest: (id: string) => toggle('/master-data/interests', id),
  toggleLanguage: (id: string) => toggle('/master-data/languages', id),
  toggleAppLanguage: (id: string) => toggle('/master-data/app-languages', id),
  toggleTicketCategory: (id: string) => toggle('/master-data/ticket-categories', id),
  toggleIncidentType: (id: string) => toggle('/master-data/incident-types', id),
  toggleCommunicationStyle: (id: string) => toggle('/master-data/communication-styles', id),
  toggleActivityPace: (id: string) => toggle('/master-data/activity-paces', id),
  toggleSessionDuration: (id: string) => toggle('/master-data/session-durations', id),
  toggleNotificationCategory: (id: string) => toggle('/master-data/notification-categories', id),
  toggleReviewTag: (id: string) => toggle('/master-data/review-tags', id),
  toggleDisputeReason: (id: string) => toggle('/master-data/dispute-reasons', id),
  toggleCancellationReason: (id: string) => toggle('/master-data/cancellation-reasons', id),
  toggleKYCDocumentType: (id: string) => toggle('/master-data/kyc-doc-types', id),
  togglePlaceTypeAllowed: (id: string) => toggle('/master-data/place-types', id),

  updatePlaceType: async (id: string, displayName: Record<string, string>): Promise<void> => {
    await axios.patch('/master-data/place-types/' + id, { displayName });
  },
  updateInterestMultiplier: async (id: string, multiplier: number): Promise<void> => {
    await axios.patch('/master-data/interests/' + id + '/multiplier', {
      basePriceMultiplier: multiplier,
    });
  },

  addCity: async (data: Omit<City, 'id'>): Promise<void> => {
    const { serviceHoursOverride, ...rest } = data;
    delete (rest as Partial<City>).areas;
    await create('/master-data/cities', {
      ...rest,
      cityCode: cityCode(data),
      serviceHoursOpen: serviceHoursOverride?.openTime,
      serviceHoursClose: serviceHoursOverride?.closeTime,
    });
  },
  addInterest: (data: Omit<Interest, 'id'>) => create('/master-data/interests', data),
  addLanguage: (data: Omit<Language, 'id'>) => create('/master-data/languages', data),
  addAppLanguage: (data: Omit<AppLanguage, 'id'>) => create('/master-data/app-languages', data),
  addTicketCategory: (data: Omit<TicketCategory, 'id'>) =>
    create('/master-data/ticket-categories', data),
  addIncidentType: (data: Omit<IncidentType, 'id'>) => create('/master-data/incident-types', data),
  addCommunicationStyle: (data: Omit<CommunicationStyleOption, 'id'>) =>
    create('/master-data/communication-styles', data),
  addActivityPace: (data: Omit<ActivityPaceOption, 'id'>) =>
    create('/master-data/activity-paces', data),
  addSessionDuration: (data: Omit<SessionDurationOption, 'id'>) =>
    create('/master-data/session-durations', data),
  addNotificationCategory: (data: Omit<NotificationCategoryOption, 'id'>) =>
    create('/master-data/notification-categories', data),
  addReviewTag: (data: Omit<ReviewTagOption, 'id'>) => create('/master-data/review-tags', data),
  addDisputeReason: (data: Omit<DisputeReason, 'id'>) =>
    create('/master-data/dispute-reasons', data),
  addCancellationReason: (data: Omit<CancellationReason, 'id'>) =>
    create('/master-data/cancellation-reasons', data),
  addKYCDocumentType: (data: Omit<KYCDocumentType, 'id'>) =>
    create('/master-data/kyc-doc-types', data),

  addAreaToCity: async (
    cityId: string,
    areaName: Record<string, string>,
    lat?: number,
    lng?: number,
  ): Promise<void> => {
    await create('/master-data/cities/' + cityId + '/areas', { name: areaName, lat, lng });
  },
  toggleArea: async (cityId: string, areaId: string): Promise<void> => {
    await axios.patch('/master-data/cities/' + cityId + '/areas/' + areaId + '/toggle');
  },
  updateCityServiceHours: async (
    cityId: string,
    hours: { openTime: string; closeTime: string } | null,
  ): Promise<void> => {
    await axios.put(
      '/master-data/cities/' + cityId + '/service-hours',
      hours
        ? { serviceHoursOpen: hours.openTime, serviceHoursClose: hours.closeTime }
        : { serviceHoursOpen: null, serviceHoursClose: null },
    );
  },

  getDefaults: async (): Promise<SystemDefaults> => {
    const response = await axios.get('/master-data/defaults');
    const value = response.data.data?.data ?? response.data.data;
    return { defaultCurrency: value.defaultCurrency, defaultLanguage: value.defaultLanguage };
  },
  updateDefaults: async (defaults: SystemDefaults): Promise<void> => {
    await axios.put('/master-data/defaults', defaults);
  },
};
