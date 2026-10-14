import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { payoutsApi } from '../api';
import type { PayoutStatus } from '../types';
import { toast } from 'sonner';

export const usePayouts = (page: number, status?: PayoutStatus) => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['payouts', page, status],
    queryFn: () => payoutsApi.getPayouts(page, status),
  });
  const mutation = useMutation({
    mutationFn: payoutsApi.updatePayout,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['payouts'] }),
        queryClient.invalidateQueries({ queryKey: ['revenue-stats'] }),
      ]);
      toast.success('Payout record updated');
    },
    onError: (error) => {
      const message = isAxiosError(error) ? error.response?.data?.error?.message : undefined;
      toast.error(typeof message === 'string' ? message : 'Unable to update payout. Please retry.');
      void queryClient.invalidateQueries({ queryKey: ['payouts'] });
    },
  });
  return { query, mutation };
};
