import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataApi } from '../api';
import { City, Interest, Language } from '../types';
import { toast } from 'sonner';

export const useMasterData = () => {
  const queryClient = useQueryClient();

  const citiesQuery = useQuery({ queryKey: ['cities'], queryFn: masterDataApi.getCities });
  const interestsQuery = useQuery({ queryKey: ['interests'], queryFn: masterDataApi.getInterests });
  const languagesQuery = useQuery({ queryKey: ['languages'], queryFn: masterDataApi.getLanguages });
  const appLanguagesQuery = useQuery({ queryKey: ['appLanguages'], queryFn: masterDataApi.getAppLanguages });
  
  const ticketCategoriesQuery = useQuery({ queryKey: ['ticketCategories'], queryFn: masterDataApi.getTicketCategories });
  const incidentTypesQuery = useQuery({ queryKey: ['incidentTypes'], queryFn: masterDataApi.getIncidentTypes });
  const communicationStylesQuery = useQuery({ queryKey: ['communicationStyles'], queryFn: masterDataApi.getCommunicationStyles });
  const activityPacesQuery = useQuery({ queryKey: ['activityPaces'], queryFn: masterDataApi.getActivityPaces });
  const sessionDurationsQuery = useQuery({ queryKey: ['sessionDurations'], queryFn: masterDataApi.getSessionDurations });
  const notificationCategoriesQuery = useQuery({ queryKey: ['notificationCategories'], queryFn: masterDataApi.getNotificationCategories });
  const reviewTagsQuery = useQuery({ queryKey: ['reviewTags'], queryFn: masterDataApi.getReviewTags });
  const disputeReasonsQuery = useQuery({ queryKey: ['disputeReasons'], queryFn: masterDataApi.getDisputeReasons });
  const cancellationReasonsQuery = useQuery({ queryKey: ['cancellationReasons'], queryFn: masterDataApi.getCancellationReasons });
  const kycDocumentTypesQuery = useQuery({ queryKey: ['kycDocumentTypes'], queryFn: masterDataApi.getKYCDocumentTypes });

  const toggleCityMutation = useMutation({
    mutationFn: masterDataApi.toggleCity,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cities'] }); toast.success('Status updated'); }
  });
  const toggleInterestMutation = useMutation({
    mutationFn: masterDataApi.toggleInterest,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['interests'] }); toast.success('Status updated'); }
  });
  const toggleLanguageMutation = useMutation({
    mutationFn: masterDataApi.toggleLanguage,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['languages'] }); toast.success('Status updated'); }
  });
  const toggleAppLanguageMutation = useMutation({
    mutationFn: masterDataApi.toggleAppLanguage,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['appLanguages'] }); toast.success('Status updated'); }
  });
  
  const toggleTicketCategoryMutation = useMutation({
    mutationFn: masterDataApi.toggleTicketCategory,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ticketCategories'] }); toast.success('Status updated'); }
  });
  const toggleIncidentTypeMutation = useMutation({
    mutationFn: masterDataApi.toggleIncidentType,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['incidentTypes'] }); toast.success('Status updated'); }
  });
  const toggleCommunicationStyleMutation = useMutation({
    mutationFn: masterDataApi.toggleCommunicationStyle,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['communicationStyles'] }); toast.success('Status updated'); }
  });
  const toggleActivityPaceMutation = useMutation({
    mutationFn: masterDataApi.toggleActivityPace,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['activityPaces'] }); toast.success('Status updated'); }
  });
  const toggleSessionDurationMutation = useMutation({
    mutationFn: masterDataApi.toggleSessionDuration,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sessionDurations'] }); toast.success('Status updated'); }
  });
  const toggleNotificationCategoryMutation = useMutation({
    mutationFn: masterDataApi.toggleNotificationCategory,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notificationCategories'] }); toast.success('Status updated'); }
  });
  const toggleReviewTagMutation = useMutation({
    mutationFn: masterDataApi.toggleReviewTag,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reviewTags'] }); toast.success('Status updated'); }
  });
  const toggleDisputeReasonMutation = useMutation({
    mutationFn: masterDataApi.toggleDisputeReason,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['disputeReasons'] }); toast.success('Status updated'); }
  });
  const toggleCancellationReasonMutation = useMutation({
    mutationFn: masterDataApi.toggleCancellationReason,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cancellationReasons'] }); toast.success('Status updated'); }
  });
  const toggleKYCDocumentTypeMutation = useMutation({
    mutationFn: masterDataApi.toggleKYCDocumentType,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['kycDocumentTypes'] }); toast.success('Status updated'); }
  });

  const addCityMutation = useMutation({
    mutationFn: masterDataApi.addCity,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cities'] }); toast.success('City added'); }
  });
  const addInterestMutation = useMutation({
    mutationFn: masterDataApi.addInterest,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['interests'] }); toast.success('Interest added'); }
  });
  const addLanguageMutation = useMutation({
    mutationFn: masterDataApi.addLanguage,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['languages'] }); toast.success('Language added'); }
  });
  const addAppLanguageMutation = useMutation({
    mutationFn: masterDataApi.addAppLanguage,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['appLanguages'] }); toast.success('App Language added'); }
  });
  
  const addTicketCategoryMutation = useMutation({
    mutationFn: masterDataApi.addTicketCategory,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ticketCategories'] }); toast.success('Ticket Category added'); }
  });
  const addIncidentTypeMutation = useMutation({
    mutationFn: masterDataApi.addIncidentType,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['incidentTypes'] }); toast.success('Incident Type added'); }
  });
  const addCommunicationStyleMutation = useMutation({
    mutationFn: masterDataApi.addCommunicationStyle,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['communicationStyles'] }); toast.success('Communication Style added'); }
  });
  const addActivityPaceMutation = useMutation({
    mutationFn: masterDataApi.addActivityPace,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['activityPaces'] }); toast.success('Activity Pace added'); }
  });
  const addSessionDurationMutation = useMutation({
    mutationFn: masterDataApi.addSessionDuration,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sessionDurations'] }); toast.success('Session Duration added'); }
  });
  const addNotificationCategoryMutation = useMutation({
    mutationFn: masterDataApi.addNotificationCategory,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notificationCategories'] }); toast.success('Notification Category added'); }
  });
  const addReviewTagMutation = useMutation({
    mutationFn: masterDataApi.addReviewTag,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reviewTags'] }); toast.success('Review Tag added'); }
  });
  const addDisputeReasonMutation = useMutation({
    mutationFn: masterDataApi.addDisputeReason,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['disputeReasons'] }); toast.success('Dispute Reason added'); }
  });
  const addCancellationReasonMutation = useMutation({
    mutationFn: masterDataApi.addCancellationReason,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cancellationReasons'] }); toast.success('Cancellation Reason added'); }
  });
  const addKYCDocumentTypeMutation = useMutation({
    mutationFn: masterDataApi.addKYCDocumentType,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['kycDocumentTypes'] }); toast.success('KYC Document Type added'); }
  });

  const addAreaToCityMutation = useMutation({
    mutationFn: ({ cityId, areaName, lat, lng }: { cityId: string, areaName: Record<string, string>, lat?: number, lng?: number }) => masterDataApi.addAreaToCity(cityId, areaName, lat, lng),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cities'] }); toast.success('Area added'); }
  });
  const toggleAreaMutation = useMutation({
    mutationFn: ({ cityId, areaId }: { cityId: string, areaId: string }) => masterDataApi.toggleArea(cityId, areaId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cities'] }); toast.success('Status updated'); }
  });

  const defaultsQuery = useQuery({ queryKey: ['system-defaults'], queryFn: masterDataApi.getDefaults });

  const updateDefaultsMutation = useMutation({
    mutationFn: masterDataApi.updateDefaults,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['system-defaults'] }); toast.success('Defaults updated'); }
  });

  return {
    cities: citiesQuery.data || [],
    interests: interestsQuery.data || [],
    languages: languagesQuery.data || [],
    appLanguages: appLanguagesQuery.data || [],
    ticketCategories: ticketCategoriesQuery.data || [],
    incidentTypes: incidentTypesQuery.data || [],
    communicationStyles: communicationStylesQuery.data || [],
    activityPaces: activityPacesQuery.data || [],
    sessionDurations: sessionDurationsQuery.data || [],
    notificationCategories: notificationCategoriesQuery.data || [],
    reviewTags: reviewTagsQuery.data || [],
    disputeReasons: disputeReasonsQuery.data || [],
    cancellationReasons: cancellationReasonsQuery.data || [],
    kycDocumentTypes: kycDocumentTypesQuery.data || [],
    defaults: defaultsQuery.data,
    isLoading: citiesQuery.isLoading || interestsQuery.isLoading || languagesQuery.isLoading || appLanguagesQuery.isLoading || defaultsQuery.isLoading || ticketCategoriesQuery.isLoading || incidentTypesQuery.isLoading || communicationStylesQuery.isLoading || activityPacesQuery.isLoading || sessionDurationsQuery.isLoading || notificationCategoriesQuery.isLoading || reviewTagsQuery.isLoading || disputeReasonsQuery.isLoading || cancellationReasonsQuery.isLoading || kycDocumentTypesQuery.isLoading,
    
    toggleCity: toggleCityMutation.mutate,
    toggleInterest: toggleInterestMutation.mutate,
    toggleLanguage: toggleLanguageMutation.mutate,
    toggleAppLanguage: toggleAppLanguageMutation.mutate,
    toggleTicketCategory: toggleTicketCategoryMutation.mutate,
    toggleIncidentType: toggleIncidentTypeMutation.mutate,
    toggleCommunicationStyle: toggleCommunicationStyleMutation.mutate,
    toggleActivityPace: toggleActivityPaceMutation.mutate,
    toggleSessionDuration: toggleSessionDurationMutation.mutate,
    toggleNotificationCategory: toggleNotificationCategoryMutation.mutate,
    toggleReviewTag: toggleReviewTagMutation.mutate,
    toggleDisputeReason: toggleDisputeReasonMutation.mutate,
    toggleCancellationReason: toggleCancellationReasonMutation.mutate,
    toggleKYCDocumentType: toggleKYCDocumentTypeMutation.mutate,
    
    addCity: addCityMutation.mutate,
    addInterest: addInterestMutation.mutate,
    addLanguage: addLanguageMutation.mutate,
    addAppLanguage: addAppLanguageMutation.mutate,
    addTicketCategory: addTicketCategoryMutation.mutate,
    addIncidentType: addIncidentTypeMutation.mutate,
    addCommunicationStyle: addCommunicationStyleMutation.mutate,
    addActivityPace: addActivityPaceMutation.mutate,
    addSessionDuration: addSessionDurationMutation.mutate,
    addNotificationCategory: addNotificationCategoryMutation.mutate,
    addReviewTag: addReviewTagMutation.mutate,
    addDisputeReason: addDisputeReasonMutation.mutate,
    addCancellationReason: addCancellationReasonMutation.mutate,
    addKYCDocumentType: addKYCDocumentTypeMutation.mutate,

    addAreaToCity: addAreaToCityMutation.mutate,
    toggleArea: toggleAreaMutation.mutate,

    updateCityServiceHours: useMutation({
      mutationFn: ({ cityId, hours }: { cityId: string, hours: { openTime: string; closeTime: string } | null }) => masterDataApi.updateCityServiceHours(cityId, hours),
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cities'] }); toast.success('Service hours updated'); }
    }).mutate,

    updateDefaults: updateDefaultsMutation.mutate,
    isUpdatingDefaults: updateDefaultsMutation.isPending,
  };
};
