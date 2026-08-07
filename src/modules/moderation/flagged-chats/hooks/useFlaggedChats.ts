import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flaggedChatApi } from '../api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export const useFlaggedChats = () => {
  const query = useQuery({ queryKey: ['flagged-chats'], queryFn: flaggedChatApi.getChats });
  return {
    chats: query.data || [],
    isLoading: query.isLoading
  };
};

export const useFlaggedChatDetail = (id: string) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const query = useQuery({
    queryKey: ['flagged-chat', id],
    queryFn: () => flaggedChatApi.getDetail(id)
  });

  const actionMutation = useMutation({
    mutationFn: ({ action, notes }: { action: 'DISMISS' | 'WARN' | 'ESCALATE', notes: string }) => 
      flaggedChatApi.takeAction(id, action, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flagged-chats'] });
      toast.success('Action applied successfully');
      router.push('/moderation/flagged-chats');
    }
  });

  return {
    detail: query.data,
    isLoading: query.isLoading,
    takeAction: actionMutation.mutate,
    isActioning: actionMutation.isPending
  };
};
