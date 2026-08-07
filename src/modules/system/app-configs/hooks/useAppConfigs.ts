import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appConfigsApi } from '../api';
import { toast } from 'sonner';

export const useAppConfigs = () => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['app-configs'], queryFn: appConfigsApi.getConfig });

  const updateMutation = useMutation({
    mutationFn: appConfigsApi.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-configs'] });
      toast.success('App configuration updated successfully');
    }
  });

  return {
    config: query.data,
    isLoading: query.isLoading,
    updateConfig: updateMutation.mutate,
    isUpdating: updateMutation.isPending
  };
};
