import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { escrowApi } from '../api';
import { toast } from 'sonner';

export const useEscrow = () => {
  const queryClient = useQueryClient();

  const recordsQuery = useQuery({
    queryKey: ['escrow-records'],
    queryFn: escrowApi.getRecords,
  });

  const configQuery = useQuery({
    queryKey: ['escrow-config'],
    queryFn: escrowApi.getWithdrawalLimits,
  });

  const releaseMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => escrowApi.releaseEscrow(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow-records'] });
      toast.success('Funds released from escrow');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'FROZEN' }) => escrowApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow-records'] });
      toast.success('Wallet status updated');
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: escrowApi.updateWithdrawalLimits,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow-config'] });
      toast.success('Withdrawal limits updated');
    },
  });

  return {
    records: recordsQuery.data ?? [],
    isLoading: recordsQuery.isLoading,
    config: configQuery.data,
    releaseEscrow: releaseMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    updateConfig: updateConfigMutation.mutate,
  };
};
