import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { growthAbuseApi } from '../api';
import { toast } from 'sonner';
import { GrowthAbuseAlert } from '../types';

export const useGrowthAbuse = () => {
  const queryClient = useQueryClient();

  const alertsQuery = useQuery({
    queryKey: ['growth-abuse-alerts'],
    queryFn: growthAbuseApi.getAlerts,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: GrowthAbuseAlert['status'] }) => growthAbuseApi.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['growth-abuse-alerts'] });
      toast.success(`Alert status updated to ${status}`);
    },
  });

  const takeActionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'BLOCK_REFERRAL' | 'BAN_ACCOUNTS' }) => growthAbuseApi.takeAction(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['growth-abuse-alerts'] });
      toast.success('Action successfully executed');
    },
  });

  return {
    alerts: alertsQuery.data ?? [],
    isLoading: alertsQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
    takeAction: takeActionMutation.mutate,
  };
};
