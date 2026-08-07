import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../api';
import { toast } from 'sonner';

export const useEvents = () => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['events'], queryFn: eventsApi.getEvents });

  const createMutation = useMutation({
    mutationFn: eventsApi.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event created');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: eventsApi.toggleEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event status toggled');
    }
  });

  return {
    events: query.data || [],
    isLoading: query.isLoading,
    createEvent: createMutation.mutate,
    isCreating: createMutation.isPending,
    toggleEvent: toggleMutation.mutate
  };
};
