import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trustScoreApi } from '../api';
import { toast } from 'sonner';

export const useTrustScores = () => {
  const queryClient = useQueryClient();

  const summariesQuery = useQuery({ queryKey: ['trust-scores'], queryFn: trustScoreApi.getSummaries });
  const rulesQuery = useQuery({ queryKey: ['safety-rules'], queryFn: trustScoreApi.getBonusRules });

  const toggleRuleMutation = useMutation({
    mutationFn: trustScoreApi.toggleBonusRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-rules'] });
      toast.success('Rule status updated');
    }
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
    queryFn: () => trustScoreApi.getDetail(companionId)
  });

  const overrideMutation = useMutation({
    mutationFn: ({ score, reason, admin }: { score: number, reason: string, admin: string }) => 
      trustScoreApi.applyOverride(companionId, score, reason, admin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trust-score', companionId] });
      toast.success('Trust score manually overridden');
    }
  });

  return {
    detail: query.data,
    isLoading: query.isLoading,
    applyOverride: overrideMutation.mutate,
    isOverriding: overrideMutation.isPending
  };
};
