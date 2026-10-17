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

  const updateMutation = useMutation({
    meta: { workflow: true },
    mutationFn: ({ id, announcement }: {
      id: string;
      announcement: Parameters<typeof notificationsApi.updateAnnouncement>[1];
    }) => notificationsApi.updateAnnouncement(id, announcement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Announcement updated');
    },
  });

  const publicationMutation = useMutation({
    meta: { workflow: true },
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      notificationsApi.setPublished(id, isPublished),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(variables.isPublished ? 'Announcement published in the app' : 'Announcement removed from the app');
    },
  });

  return {
    notifications: query.data || [],
    config: configQuery.data,
    isLoading: query.isLoading || configQuery.isLoading,
    createNotification: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    sendNow: sendMutation.mutate,
    updateAnnouncement: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    setPublished: publicationMutation.mutate,
    isChangingPublication: publicationMutation.isPending,
  };
};
