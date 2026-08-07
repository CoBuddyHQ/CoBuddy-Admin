import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatSettingsApi } from '../api';
import { toast } from 'sonner';

export const useChatSettings = () => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['chat-settings'], queryFn: chatSettingsApi.getSettings });

  const updateMutation = useMutation({
    mutationFn: chatSettingsApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-settings'] });
      toast.success('Chat settings updated');
    }
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending
  };
};
