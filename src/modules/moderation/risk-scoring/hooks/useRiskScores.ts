import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { riskScoringApi } from '../api';
import { toast } from 'sonner';

export const useRiskScores = () => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['risk-scores'], queryFn: riskScoringApi.getScores });

  const reclassifyMutation = useMutation({
    mutationFn: ({ userId, level }: { userId: string, level: any }) => riskScoringApi.reclassify(userId, level),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-scores'] });
      toast.success('Risk level manually reclassified');
    }
  });

  return {
    scores: query.data || [],
    isLoading: query.isLoading,
    reclassify: reclassifyMutation.mutate,
    isReclassifying: reclassifyMutation.isPending
  };
};
