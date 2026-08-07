import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rankingConfigApi } from '../api';
import { toast } from 'sonner';

export const useRankingConfig = () => {
  const queryClient = useQueryClient();

  const weightsQuery = useQuery({ queryKey: ['ranking-weights'], queryFn: rankingConfigApi.getWeights });
  const promotedQuery = useQuery({ queryKey: ['promoted-companions'], queryFn: rankingConfigApi.getPromoted });

  const updateWeightsMutation = useMutation({
    mutationFn: rankingConfigApi.updateWeights,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ranking-weights'] });
      toast.success('Ranking weights updated');
    }
  });

  const addPromotedMutation = useMutation({
    mutationFn: rankingConfigApi.addPromoted,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoted-companions'] });
      toast.success('Companion promoted');
    }
  });

  const removePromotedMutation = useMutation({
    mutationFn: rankingConfigApi.removePromoted,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoted-companions'] });
      toast.success('Companion removed from promoted list');
    }
  });

  return {
    weights: weightsQuery.data,
    isLoadingWeights: weightsQuery.isLoading,
    updateWeights: updateWeightsMutation.mutate,
    isUpdatingWeights: updateWeightsMutation.isPending,
    
    promoted: promotedQuery.data,
    isLoadingPromoted: promotedQuery.isLoading,
    addPromoted: addPromotedMutation.mutate,
    removePromoted: removePromotedMutation.mutate
  };
};
