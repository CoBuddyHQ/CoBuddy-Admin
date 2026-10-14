import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api';
import { toast } from 'sonner';

export const useNotifications = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    throwOnError: true,
    meta: { workflow: true },
    queryKey: ['notifications'],
    queryFn: notificationsApi.getNotifications,
    refetchInterval: 15000,
  });
  const configQuery = useQuery({
    throwOnError: true,
    meta: { workflow: true },
    queryKey: ['notification-config'],
    queryFn: notificationsApi.getConfig,
  });

  const createMutation = useMutation({
    meta: { workflow: true },
    mutationFn: notificationsApi.createNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification saved');
    },
  });

  const sendMutation = useMutation({
    meta: { workflow: true },
    mutationFn: notificationsApi.sendNow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification queued for delivery');
    },
  });

  return {
    notifications: query.data || [],
    config: configQuery.data,
    isLoading: query.isLoading || configQuery.isLoading,
    createNotification: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    sendNow: sendMutation.mutate,
  };
};
