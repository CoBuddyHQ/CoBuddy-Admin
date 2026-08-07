import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fraudApi } from '../api';
import { toast } from 'sonner';
import { FraudAlert } from '../types';

export const useFraudDetection = () => {
  const queryClient = useQueryClient();

  const alertsQuery = useQuery({
    queryKey: ['fraud-alerts'],
    queryFn: fraudApi.getAlerts,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: FraudAlert['status'] }) => fraudApi.updateAlertStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['fraud-alerts'] });
      toast.success(`Fraud alert marked as ${status}`);
    },
  });

  return {
    alerts: alertsQuery.data ?? [],
    isLoading: alertsQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
  };
};
