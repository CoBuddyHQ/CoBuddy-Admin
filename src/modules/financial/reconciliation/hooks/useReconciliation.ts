import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reconciliationApi } from '../api';
import { toast } from 'sonner';
import { ReconciliationRecord } from '../types';

export const useReconciliation = () => {
  const queryClient = useQueryClient();

  const recordsQuery = useQuery({
    queryKey: ['reconciliation-records'],
    queryFn: reconciliationApi.getRecords,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: Exclude<ReconciliationRecord['matchStatus'], 'PENDING'>;
    }) => reconciliationApi.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-records'] });
      toast.success(`Record marked as ${status}`);
    },
  });

  return {
    records: recordsQuery.data ?? [],
    isLoading: recordsQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
  };
};
