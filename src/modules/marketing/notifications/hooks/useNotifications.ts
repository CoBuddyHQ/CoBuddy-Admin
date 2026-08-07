import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api';
import { toast } from 'sonner';

export const useNotifications = () => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.getNotifications });

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

  return {
    notifications: query.data || [],
    isLoading: query.isLoading,
    createNotification: createMutation.mutate,
    isCreating: createMutation.isPending,
    sendNow: sendMutation.mutate
  };
};
