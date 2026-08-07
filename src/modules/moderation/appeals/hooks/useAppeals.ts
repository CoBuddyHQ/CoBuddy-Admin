import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appealsApi } from '../api';
import { toast } from 'sonner';

export const useAppeals = () => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['appeals'], queryFn: appealsApi.getAppeals });

  const resolveMutation = useMutation({
    mutationFn: ({ id, action }: { id: string, action: 'UPHELD' | 'REVERSED' | 'REDUCED_TO_WARNING' }) => appealsApi.resolveAppeal(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appeals'] });
      toast.success('Appeal resolved successfully');
    }
  });

  return {
    appeals: query.data || [],
    isLoading: query.isLoading,
    resolveAppeal: resolveMutation.mutate,
    isResolving: resolveMutation.isPending
  };
};
