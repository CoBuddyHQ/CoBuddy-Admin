import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { verificationApi } from '../api';
import { toast } from 'sonner';
import { AutomationThresholds } from '../types';
import { isAxiosError } from 'axios';

export const useVerificationSettings = (enabled = true) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['verification-settings'],
    queryFn: verificationApi.getThresholds,
    enabled,
  });

  const mutation = useMutation({
    mutationFn: (data: AutomationThresholds) => verificationApi.updateThresholds(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['verification-settings'], data);
      toast.success('Verification settings saved');
    },
    onError: (error) => {
      const message = isAxiosError(error) ? error.response?.data?.error?.message : undefined;
      toast.error(typeof message === 'string' ? message : 'Failed to save settings');
    },
  });

  return {
    settings: query.data,
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
    saveSettings: mutation.mutateAsync,
    isSaving: mutation.isPending,
    saveError: mutation.error,
  };
};
