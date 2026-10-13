import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rankingConfigApi } from '../api';
import { toast } from 'sonner';

export const useRankingConfig = () => {
  const queryClient = useQueryClient();

  const weightsQuery = useQuery({
    throwOnError: true,
    meta: { workflow: true },
    queryKey: ['ranking-weights'],
    queryFn: rankingConfigApi.getWeights,
  });
  const promotedQuery = useQuery({
    throwOnError: true,
    meta: { workflow: true },
    queryKey: ['promoted-companions'],
    queryFn: rankingConfigApi.getPromoted,
  });

  const updateWeightsMutation = useMutation({
    meta: { workflow: true },
    mutationFn: rankingConfigApi.updateWeights,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ranking-weights'] });
      toast.success('Ranking weights updated');
    },
  });

  const addPromotedMutation = useMutation({
    meta: { workflow: true },
    mutationFn: rankingConfigApi.addPromoted,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoted-companions'] });
      toast.success('Companion promoted');
    },
  });

  const removePromotedMutation = useMutation({
    meta: { workflow: true },
    mutationFn: rankingConfigApi.removePromoted,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoted-companions'] });
      toast.success('Companion removed from promoted list');
    },
  });

  return {
    weights: weightsQuery.data,
    isLoadingWeights: weightsQuery.isLoading,
    updateWeights: updateWeightsMutation.mutate,
    isUpdatingWeights: updateWeightsMutation.isPending,

    promoted: promotedQuery.data,
    isLoadingPromoted: promotedQuery.isLoading,
    addPromoted: addPromotedMutation.mutate,
    removePromoted: removePromotedMutation.mutate,
  };
};
