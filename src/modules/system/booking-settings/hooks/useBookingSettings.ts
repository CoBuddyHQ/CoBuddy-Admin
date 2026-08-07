import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingSettingsApi } from '../api';
import { toast } from 'sonner';

export const useBookingSettings = () => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['booking-settings'], queryFn: bookingSettingsApi.getSettings });

  const updateMutation = useMutation({
    mutationFn: bookingSettingsApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-settings'] });
      toast.success('Booking settings updated');
    }
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending
  };
};
