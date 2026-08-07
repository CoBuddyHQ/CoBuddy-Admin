import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { verificationApi } from '../api';
import { toast } from 'sonner';
import { AutomationThresholds } from '../types';

export const useVerificationSettings = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['verification-settings'],
    queryFn: verificationApi.getThresholds,
  });

  const mutation = useMutation({
    mutationFn: (data: AutomationThresholds) => verificationApi.updateThresholds(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-settings'] });
      toast.success('Automation settings saved');
    },
    onError: () => {
      toast.error('Failed to save settings');
    }
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    saveSettings: mutation.mutate,
    isSaving: mutation.isPending
  };
};
