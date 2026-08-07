import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ageEscalationApi } from '../api';
import { toast } from 'sonner';

export const useAgeEscalation = () => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['age-escalation'], queryFn: ageEscalationApi.getCases });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: any }) => ageEscalationApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['age-escalation'] });
      toast.success('Case status updated successfully');
    }
  });

  return {
    cases: query.data || [],
    isLoading: query.isLoading,
    updateStatus: updateMutation.mutate,
    isUpdating: updateMutation.isPending
  };
};
