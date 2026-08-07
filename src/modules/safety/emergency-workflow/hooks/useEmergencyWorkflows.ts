import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emergencyWorkflowApi } from '../api';
import { toast } from 'sonner';

export const useEmergencyWorkflows = () => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['emergency-workflows'], queryFn: emergencyWorkflowApi.getWorkflows });

  const advanceMutation = useMutation({
    mutationFn: ({ id, status, detail, handler }: { id: string, status: any, detail: string, handler: string }) => 
      emergencyWorkflowApi.advanceStep(id, status, detail, handler),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-workflows'] });
      toast.success('Workflow step advanced');
    }
  });

  return {
    workflows: query.data || [],
    isLoading: query.isLoading,
    advanceStep: advanceMutation.mutate,
    isAdvancing: advanceMutation.isPending
  };
};
