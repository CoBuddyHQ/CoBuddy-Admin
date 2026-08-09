import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../api';
import { toast } from 'sonner';
import { SupportTicket } from '../types';

export const useTickets = () => {
  const queryClient = useQueryClient();

  const ticketsQuery = useQuery({
    queryKey: ['support-tickets'],
    queryFn: ticketsApi.getTickets,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SupportTicket['status'] }) => ticketsApi.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success(`Ticket status updated to ${status}`);
    },
  });

  const escalateMutation = useMutation({
    mutationFn: ticketsApi.escalateTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Ticket escalated');
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => ticketsApi.addReply(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Reply sent');
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, staffName }: { id: string; staffName: string }) => ticketsApi.assignToMe(id, staffName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Ticket assigned to you');
    },
  });

  const reassignMutation = useMutation({
    mutationFn: ({ id, newStaffName }: { id: string; newStaffName: string }) => ticketsApi.reassignTicket(id, newStaffName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Ticket reassigned');
    },
  });

  return {
    tickets: ticketsQuery.data ?? [],
    isLoading: ticketsQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
    escalateTicket: escalateMutation.mutate,
    addReply: replyMutation.mutate,
    assignToMe: assignMutation.mutate,
    reassignTicket: reassignMutation.mutate,
  };
};
