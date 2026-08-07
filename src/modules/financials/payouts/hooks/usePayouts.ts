import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payoutsApi } from '../api';
import { toast } from 'sonner';

export const usePayouts = () => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['payouts'], queryFn: payoutsApi.getPayouts });

  const processMutation = useMutation({
    mutationFn: payoutsApi.processPayout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      toast.success('Payout processing initiated');
    }
  });

  const holdMutation = useMutation({
    mutationFn: payoutsApi.holdPayout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      toast.success('Payout put on hold');
    }
  });

  return {
    payouts: query.data || [],
    isLoading: query.isLoading,
    processPayout: processMutation.mutate,
    holdPayout: holdMutation.mutate
  };
};
