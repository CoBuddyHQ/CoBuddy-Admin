import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { liveSessionsApi } from '../api';
import { toast } from 'sonner';

export const useLiveSessions = () => {
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['liveSessions'],
    queryFn: liveSessionsApi.getLiveSessions,
    refetchInterval: 10000 // Poll every 10s for live updates
  });

  const { mutate: resolveSOS } = useMutation({
    mutationFn: (id: string) => liveSessionsApi.resolveSOS(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveSessions'] });
      toast.success('SOS alert resolved');
    }
  });

  return {
    sessions,
    isLoading,
    resolveSOS
  };
};
