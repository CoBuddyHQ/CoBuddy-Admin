import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { globalSettingsApi } from '../api';
import { toast } from 'sonner';

export const useGlobalSettings = () => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['global-settings'], queryFn: globalSettingsApi.getSettings });

  const updateMutation = useMutation({
    mutationFn: globalSettingsApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-settings'] });
      toast.success('Global settings updated successfully');
    }
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending
  };
};
