import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { waitlistApi } from '../api';
import { toast } from 'sonner';

export const useWaitlist = () => {
  const queryClient = useQueryClient();

  const configQuery = useQuery({ queryKey: ['waitlist-config'], queryFn: waitlistApi.getConfig });
  const entriesQuery = useQuery({ queryKey: ['waitlist-entries'], queryFn: waitlistApi.getEntries });

  const updateMutation = useMutation({
    mutationFn: waitlistApi.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist-config'] });
      toast.success('Waitlist config updated');
    }
  });

  const approveMutation = useMutation({
    mutationFn: waitlistApi.approveEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist-entries'] });
      toast.success('User approved from waitlist');
    }
  });

  return {
    config: configQuery.data,
    entries: entriesQuery.data || [],
    isLoading: configQuery.isLoading || entriesQuery.isLoading,
    updateConfig: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    approveEntry: approveMutation.mutate
  };
};
