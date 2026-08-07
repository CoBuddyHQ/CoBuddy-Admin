import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companionsApi } from '../api';
import { toast } from 'sonner';
import { CompanionRecord } from '../types';

export const useCompanions = () => {
  const queryClient = useQueryClient();

  const companionsQuery = useQuery({
    queryKey: ['companions'],
    queryFn: companionsApi.getCompanions,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CompanionRecord['status'] }) => companionsApi.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['companions'] });
      toast.success(`Companion status updated to ${status}`);
    },
  });

  return {
    companions: companionsQuery.data ?? [],
    isLoading: companionsQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
  };
};
