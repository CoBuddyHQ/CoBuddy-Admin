import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disputesApi } from '../api';
import { toast } from 'sonner';
import { BookingDispute } from '../types';

export const useDisputes = () => {
  const queryClient = useQueryClient();

  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ['disputes'],
    queryFn: disputesApi.getDisputes
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string, status: BookingDispute['status'] }) => disputesApi.updateDisputeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      toast.success('Dispute status updated successfully');
    }
  });

  return {
    disputes,
    isLoading,
    updateStatus
  };
};
