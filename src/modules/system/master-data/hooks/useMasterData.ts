import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataApi } from '../api';
import { City, Interest, Language } from '../types';
import { toast } from 'sonner';

export const useMasterData = () => {
  const queryClient = useQueryClient();

  const citiesQuery = useQuery({ queryKey: ['cities'], queryFn: masterDataApi.getCities });
  const interestsQuery = useQuery({ queryKey: ['interests'], queryFn: masterDataApi.getInterests });
  const languagesQuery = useQuery({ queryKey: ['languages'], queryFn: masterDataApi.getLanguages });

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

  const defaultsQuery = useQuery({ queryKey: ['system-defaults'], queryFn: masterDataApi.getDefaults });

  const updateDefaultsMutation = useMutation({
    mutationFn: masterDataApi.updateDefaults,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['system-defaults'] }); toast.success('Defaults updated'); }
  });

  return {
    cities: citiesQuery.data || [],
    interests: interestsQuery.data || [],
    languages: languagesQuery.data || [],
    defaults: defaultsQuery.data,
    isLoading: citiesQuery.isLoading || interestsQuery.isLoading || languagesQuery.isLoading || defaultsQuery.isLoading,
    
    toggleCity: toggleCityMutation.mutate,
    toggleInterest: toggleInterestMutation.mutate,
    toggleLanguage: toggleLanguageMutation.mutate,
    
    addCity: addCityMutation.mutate,
    addInterest: addInterestMutation.mutate,
    addLanguage: addLanguageMutation.mutate,

    updateDefaults: updateDefaultsMutation.mutate,
    isUpdatingDefaults: updateDefaultsMutation.isPending,
  };
};
