import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { refundsApi } from '../api';
import { toast } from 'sonner';

import { BookingSettings } from '../types';

export const useRefunds = () => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['refunds'], queryFn: refundsApi.getRefunds });
  const settingsQuery = useQuery({ queryKey: ['booking-settings'], queryFn: refundsApi.getSettings });

  const processMutation = useMutation({
    mutationFn: ({ id, action }: { id: string, action: 'APPROVE' | 'REJECT' }) => refundsApi.processRefund(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      toast.success('Refund processed successfully');
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: BookingSettings) => refundsApi.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-settings'] });
      toast.success('Settings updated');
    }
  });

  return {
    refunds: query.data || [],
    settings: settingsQuery.data,
    isLoading: query.isLoading || settingsQuery.isLoading,
    processRefund: processMutation.mutate,
    updateSettings: updateSettingsMutation.mutate,
    isUpdatingSettings: updateSettingsMutation.isPending,
  };
};
