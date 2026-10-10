import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { slaApi } from '../api';
import { toast } from 'sonner';

export const useSLA = (enabled = true) => {
  const queryClient = useQueryClient();

  const alertsQuery = useQuery({
    queryKey: ['sla-alerts'],
    queryFn: slaApi.getAlerts,
    enabled,
  });

  const perfQuery = useQuery({
    queryKey: ['agent-performance'],
    queryFn: slaApi.getPerformance,
    enabled,
  });

  const reassignMutation = useMutation({
    mutationFn: ({ ticketId, newAgentName }: { ticketId: string; newAgentName: string }) =>
      slaApi.reassignTicket(ticketId, newAgentName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-alerts'] });
      toast.success('Ticket reassigned');
    },
  });

  return {
    alerts: alertsQuery.data ?? [],
    performance: perfQuery.data ?? [],
    isLoading: alertsQuery.isLoading || perfQuery.isLoading,
    reassignTicket: reassignMutation.mutate,
  };
};
