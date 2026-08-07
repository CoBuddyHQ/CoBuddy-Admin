import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bansApi } from '../api';
import { toast } from 'sonner';

export const useBans = () => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['bans'], queryFn: bansApi.getRestrictions });

  const applyMutation = useMutation({
    mutationFn: bansApi.applyRestriction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bans'] });
      toast.success('Restriction applied and user logged out globally.');
    }
  });

  const liftMutation = useMutation({
    mutationFn: bansApi.liftRestriction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bans'] });
      toast.success('Restriction lifted successfully.');
    }
  });

  return {
    restrictions: query.data || [],
    isLoading: query.isLoading,
    applyRestriction: applyMutation.mutate,
    isApplying: applyMutation.isPending,
    liftRestriction: liftMutation.mutate,
    isLifting: liftMutation.isPending
  };
};
