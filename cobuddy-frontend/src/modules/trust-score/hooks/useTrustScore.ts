import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trustScoreApi } from '../api';
import { toast } from 'sonner';

export const useTrustScores = () => {
  const queryClient = useQueryClient();

  const summariesQuery = useQuery({
    queryKey: ['trust-scores'],
    queryFn: trustScoreApi.getSummaries,
    throwOnError: true,
    meta: { workflow: true },
  });
  const rulesQuery = useQuery({
    queryKey: ['safety-rules'],
    queryFn: trustScoreApi.getBonusRules,
    throwOnError: true,
    meta: { workflow: true },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: trustScoreApi.toggleBonusRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-rules'] });
      toast.success('Rule status updated');
    },
  });

  return {
    summaries: summariesQuery.data || [],
    rules: rulesQuery.data || [],
    isLoading: summariesQuery.isLoading || rulesQuery.isLoading,
    toggleRule: toggleRuleMutation.mutate,
  };
};

export const useTrustScoreDetail = (companionId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['trust-score', companionId],
    queryFn: () => trustScoreApi.getDetail(companionId),
    throwOnError: true,
    meta: { workflow: true },
  });

  const overrideMutation = useMutation({
    mutationFn: ({ score, reason }: { score: number; reason: string }) =>
      trustScoreApi.applyOverride(companionId, score, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trust-score', companionId] });
      queryClient.invalidateQueries({ queryKey: ['trust-scores'] });
      toast.success('Trust score manually overridden');
    },
  });

  return {
    detail: query.data,
    isLoading: query.isLoading,
    applyOverride: overrideMutation.mutateAsync,
    isOverriding: overrideMutation.isPending,
  };
};
