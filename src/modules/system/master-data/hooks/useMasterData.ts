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

  const addAreaToCityMutation = useMutation({
    mutationFn: ({ cityId, areaName }: { cityId: string, areaName: Record<string, string> }) => masterDataApi.addAreaToCity(cityId, areaName),
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
    defaults: defaultsQuery.data,
    isLoading: citiesQuery.isLoading || interestsQuery.isLoading || languagesQuery.isLoading || appLanguagesQuery.isLoading || defaultsQuery.isLoading,
    
    toggleCity: toggleCityMutation.mutate,
    toggleInterest: toggleInterestMutation.mutate,
    toggleLanguage: toggleLanguageMutation.mutate,
    toggleAppLanguage: toggleAppLanguageMutation.mutate,
    
    addCity: addCityMutation.mutate,
    addInterest: addInterestMutation.mutate,
    addLanguage: addLanguageMutation.mutate,
    addAppLanguage: addAppLanguageMutation.mutate,

    addAreaToCity: addAreaToCityMutation.mutate,
    toggleArea: toggleAreaMutation.mutate,

    updateDefaults: updateDefaultsMutation.mutate,
    isUpdatingDefaults: updateDefaultsMutation.isPending,
  };
};
