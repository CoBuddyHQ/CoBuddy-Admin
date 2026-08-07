import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationConfigsApi } from '../api';
import { toast } from 'sonner';

export const useNotificationConfigs = () => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['notification-configs'], queryFn: notificationConfigsApi.getConfig });

  const updateMutation = useMutation({
    mutationFn: notificationConfigsApi.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-configs'] });
      toast.success('Notification credentials updated');
    }
  });

  return {
    config: query.data,
    isLoading: query.isLoading,
    updateConfig: updateMutation.mutate,
    isUpdating: updateMutation.isPending
  };
};
