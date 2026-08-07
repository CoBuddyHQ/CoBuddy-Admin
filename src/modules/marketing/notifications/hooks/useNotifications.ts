import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api';
import { toast } from 'sonner';

import { NotificationConfig } from '../types';

export const useNotifications = () => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.getNotifications });
  const configQuery = useQuery({ queryKey: ['notification-config'], queryFn: notificationsApi.getConfig });

  const createMutation = useMutation({
    mutationFn: notificationsApi.createNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification saved');
    }
  });

  const sendMutation = useMutation({
    mutationFn: notificationsApi.sendNow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification sent!');
    }
  });

  const updateConfigMutation = useMutation({
    mutationFn: (config: NotificationConfig) => notificationsApi.updateConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-config'] });
      toast.success('Configuration updated');
    }
  });

  return {
    notifications: query.data || [],
    config: configQuery.data,
    isLoading: query.isLoading || configQuery.isLoading,
    createNotification: createMutation.mutate,
    isCreating: createMutation.isPending,
    sendNow: sendMutation.mutate,
    updateConfig: updateConfigMutation.mutate,
    isUpdatingConfig: updateConfigMutation.isPending,
  };
};
