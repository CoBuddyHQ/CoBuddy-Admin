import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companionsApi } from '../api';
import { toast } from 'sonner';
import { CompanionRecord } from '../types';

export const useCompanions = () => {
  const queryClient = useQueryClient();

  const companionsQuery = useQuery({
    queryKey: ['companions'],
    queryFn: companionsApi.getCompanions,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CompanionRecord['status'] }) => companionsApi.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['companions'] });
      toast.success(`Companion status updated to ${status}`);
    },
  });

  return {
    companions: companionsQuery.data ?? [],
    isLoading: companionsQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
  };
};

export const useCompanionDetail = (id: string) => {
  const queryClient = useQueryClient();

  const companionQuery = useQuery({
    queryKey: ['companions', id],
    queryFn: () => companionsApi.getCompanionById(id)
  });

  const trustScoreHistoryQuery = useQuery({
    queryKey: ['companions', id, 'trust-score'],
    queryFn: () => companionsApi.getTrustScoreHistory(id)
  });

  const sessionHistoryQuery = useQuery({
    queryKey: ['companions', id, 'sessions'],
    queryFn: () => companionsApi.getSessionHistory(id)
  });

  const earningsQuery = useQuery({
    queryKey: ['companions', id, 'earnings'],
    queryFn: () => companionsApi.getEarningsBreakdown(id)
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: CompanionRecord['status']) => companionsApi.updateStatus(id, status),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['companions'] });
      toast.success(`Companion status updated to ${status}`);
    }
  });

  return {
    companion: companionQuery.data,
    trustScoreHistory: trustScoreHistoryQuery.data,
    sessionHistory: sessionHistoryQuery.data,
    earnings: earningsQuery.data,
    isLoading: companionQuery.isLoading || trustScoreHistoryQuery.isLoading || sessionHistoryQuery.isLoading || earningsQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
  };
};
