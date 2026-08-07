import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { referralsApi } from '../api';
import { toast } from 'sonner';

export const useReferrals = () => {
  const queryClient = useQueryClient();

  const configQuery = useQuery({ queryKey: ['referral-config'], queryFn: referralsApi.getConfig });
  const leaderboardQuery = useQuery({ queryKey: ['referral-leaderboard'], queryFn: referralsApi.getLeaderboard });

  const updateMutation = useMutation({
    mutationFn: referralsApi.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-config'] });
      toast.success('Referral settings updated');
    }
  });

  return {
    config: configQuery.data,
    leaderboard: leaderboardQuery.data || [],
    isLoading: configQuery.isLoading || leaderboardQuery.isLoading,
    updateConfig: updateMutation.mutate,
    isUpdating: updateMutation.isPending
  };
};
