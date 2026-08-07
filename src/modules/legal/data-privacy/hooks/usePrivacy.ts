import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { privacyApi } from '../api';
import { toast } from 'sonner';
import { PrivacyRequest } from '../types';

export const usePrivacy = () => {
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: ['privacy-requests'],
    queryFn: privacyApi.getRequests,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PrivacyRequest['status'] }) => privacyApi.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['privacy-requests'] });
      toast.success(`Request marked as ${status}`);
    },
  });

  const toggleLegalHoldMutation = useMutation({
    mutationFn: privacyApi.toggleLegalHold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-requests'] });
      toast.success('Legal hold status updated');
    },
  });

  return {
    requests: requestsQuery.data ?? [],
    isLoading: requestsQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
    toggleLegalHold: toggleLegalHoldMutation.mutate,
  };
};
