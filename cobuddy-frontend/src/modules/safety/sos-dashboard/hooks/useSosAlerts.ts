import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sosApi } from '../api';
import { toast } from 'sonner';
import type { SosStatusUpdate } from '../types';

export const useSosAlerts = (enabled = true) => {
  const queryClient = useQueryClient();

  // Polling every 5 seconds for live dashboard
  const query = useQuery({
    queryKey: ['sos-alerts'],
    queryFn: sosApi.getAlerts,
    enabled,
    refetchInterval: 5000,
    retry: 1,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SosStatusUpdate }) =>
      sosApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sos-alerts'] });
      toast.success('SOS status updated');
    },
    onError: () => toast.error('Could not update the SOS alert. Please try again.'),
  });

  return {
    alerts: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    dataUpdatedAt: query.dataUpdatedAt,
    refetch: query.refetch,
    updateStatus: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};
