import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { legalRequestsApi } from '../api';
import { toast } from 'sonner';
import { LegalRequest } from '../types';

export const useLegalRequests = () => {
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    throwOnError: true,
    meta: { workflow: true },
    queryKey: ['legal-requests'],
    queryFn: legalRequestsApi.getRequests,
  });

  const updateStatusMutation = useMutation({
    meta: { workflow: true },
    mutationFn: ({ id, status }: { id: string; status: LegalRequest['status'] }) =>
      legalRequestsApi.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['legal-requests'] });
      toast.success(`Legal request status updated to ${status}`);
    },
  });

  const createRequestMutation = useMutation({
    meta: { workflow: true },
    mutationFn: (data: Omit<LegalRequest, 'id' | 'receivedDate' | 'associatedUserName'>) =>
      legalRequestsApi.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-requests'] });
      toast.success('Legal request logged successfully');
    },
  });

  return {
    requests: requestsQuery.data ?? [],
    isLoading: requestsQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
    createRequest: createRequestMutation.mutateAsync,
  };
};
