import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sosApi } from '../api';
import { toast } from 'sonner';

export const useSosAlerts = () => {
  const queryClient = useQueryClient();

  // Polling every 5 seconds for live dashboard
  const query = useQuery({ 
    queryKey: ['sos-alerts'], 
    queryFn: sosApi.getAlerts,
    refetchInterval: 5000 
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: any }) => sosApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sos-alerts'] });
      toast.success('SOS status updated');
    }
  });

  return {
    alerts: query.data || [],
    isLoading: query.isLoading,
    updateStatus: updateMutation.mutate
  };
};
