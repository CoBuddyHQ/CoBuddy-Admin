import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { uiDiscoveryApi } from '../api';
import { toast } from 'sonner';

export const useUIDiscovery = () => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['ui-discovery'], queryFn: uiDiscoveryApi.getSettings });

  const updateMutation = useMutation({
    mutationFn: uiDiscoveryApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ui-discovery'] });
      toast.success('UI & Discovery settings updated');
    }
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending
  };
};
