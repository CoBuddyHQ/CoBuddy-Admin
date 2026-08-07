import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchmakingApi } from '../api';
import { toast } from 'sonner';

export const useMatchmakingConfig = () => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['matchmaking-config'], queryFn: matchmakingApi.getConfig });

  const updateMutation = useMutation({
    mutationFn: matchmakingApi.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchmaking-config'] });
      toast.success('Matchmaking configuration updated successfully');
    }
  });

  return {
    config: query.data,
    isLoading: query.isLoading,
    updateConfig: updateMutation.mutate,
    isUpdating: updateMutation.isPending
  };
};
