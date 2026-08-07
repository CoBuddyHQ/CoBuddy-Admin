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
    mutationFn: ({ id, status }: { id: string; status: ReconciliationRecord['status'] }) => reconciliationApi.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-records'] });
      toast.success(`Record marked as ${status}`);
    },
  });

  const retryWebhookMutation = useMutation({
    mutationFn: reconciliationApi.retryWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-records'] });
      toast.success('Webhook processed successfully');
    },
  });

  return {
    records: recordsQuery.data ?? [],
    isLoading: recordsQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
    retryWebhook: retryWebhookMutation.mutate,
  };
};
