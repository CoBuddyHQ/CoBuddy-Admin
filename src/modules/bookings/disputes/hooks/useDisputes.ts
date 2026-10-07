import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disputesApi } from '../api';
import { toast } from 'sonner';
import { BookingDispute } from '../types';

export const useDisputes = () => {
  const queryClient = useQueryClient();

  const {
    data: disputes = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['disputes'],
    queryFn: disputesApi.getDisputes,
  });

  const { mutateAsync: updateStatus, isPending: updating } = useMutation({
    mutationFn: ({
      id,
      version,
      status,
      note,
    }: {
      id: string;
      version: number;
      status: BookingDispute['status'];
      note?: string;
    }) => disputesApi.updateDisputeStatus(id, version, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      toast.success('Dispute status updated successfully');
    },
    onError: () => toast.error('Could not update dispute. Refresh and try again.'),
  });

  const { mutateAsync: overridePenalty, isPending: overriding } = useMutation({
    mutationFn: ({
      id,
      version,
      penalty,
      reason,
    }: {
      id: string;
      version: number;
      penalty: number;
      reason: string;
    }) => disputesApi.overridePenalty(id, version, penalty, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      toast.success('Refund amount updated');
    },
    onError: () => toast.error('Could not update refund amount. Refresh and try again.'),
  });

  return {
    disputes,
    isLoading,
    isError,
    refetch,
    isPending: updating || overriding,
    updateStatus,
    overridePenalty,
  };
};
