import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { refundsApi } from '../api';
import { toast } from 'sonner';

export const useRefunds = () => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['refunds'], queryFn: refundsApi.getRefunds });

  const processMutation = useMutation({
    mutationFn: ({ id, action }: { id: string, action: 'APPROVE' | 'REJECT' }) => refundsApi.processRefund(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      toast.success('Refund processed successfully');
    }
  });

  return {
    refunds: query.data || [],
    isLoading: query.isLoading,
    processRefund: processMutation.mutate,
  };
};
