import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../api';
import { toast } from 'sonner';
import { SupportTicket } from '../types';

export const useTickets = (enabled = true) => {
  const queryClient = useQueryClient();

  const ticketsQuery = useQuery({
    throwOnError: true,
    meta: { workflow: true },
    queryKey: ['support-tickets'],
    queryFn: ticketsApi.getTickets,
    enabled,
  });

  const updateStatusMutation = useMutation({
    meta: { workflow: true },
    mutationFn: ({
      id,
      status,
      resolutionNote,
    }: {
      id: string;
      status: SupportTicket['status'];
      resolutionNote?: string;
    }) => ticketsApi.updateStatus(id, status, resolutionNote),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success(`Ticket status updated to ${status}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update ticket');
    },
  });

  const escalateMutation = useMutation({
    meta: { workflow: true },
    mutationFn: ticketsApi.escalateTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Ticket escalated');
    },
  });

  const replyMutation = useMutation({
    meta: { workflow: true },
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      ticketsApi.addReply(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Reply sent');
    },
  });

  const assignMutation = useMutation({
    meta: { workflow: true },
    mutationFn: ({ id, staffName }: { id: string; staffName: string }) =>
      ticketsApi.assignToMe(id, staffName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Ticket assigned to you');
    },
  });

  const reassignMutation = useMutation({
    meta: { workflow: true },
    mutationFn: ({ id, newStaffName }: { id: string; newStaffName: string }) =>
      ticketsApi.reassignTicket(id, newStaffName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Ticket reassigned');
    },
  });

  return {
    tickets: ticketsQuery.data ?? [],
    isLoading: ticketsQuery.isLoading,
    updateStatus: updateStatusMutation.mutateAsync,
    escalateTicket: escalateMutation.mutate,
    addReply: replyMutation.mutateAsync,
    assignToMe: assignMutation.mutate,
    reassignTicket: reassignMutation.mutate,
  };
};
