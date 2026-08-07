import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { geofenceApi } from '../api';
import { toast } from 'sonner';

export const useGeofenceAlerts = () => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['geofence-alerts'], queryFn: geofenceApi.getAlerts });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: any }) => geofenceApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofence-alerts'] });
      toast.success('Alert status updated');
    }
  });

  return {
    alerts: query.data || [],
    isLoading: query.isLoading,
    updateStatus: updateMutation.mutate,
  };
};
