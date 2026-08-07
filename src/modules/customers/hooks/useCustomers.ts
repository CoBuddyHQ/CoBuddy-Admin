import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../api';
import { toast } from 'sonner';
import { CustomerRecord } from '../types';

export const useCustomers = () => {
  const queryClient = useQueryClient();

  const customersQuery = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getCustomers,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CustomerRecord['status'] }) => customersApi.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(`Customer status updated to ${status}`);
    },
  });

  return {
    customers: customersQuery.data ?? [],
    isLoading: customersQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
  };
};
