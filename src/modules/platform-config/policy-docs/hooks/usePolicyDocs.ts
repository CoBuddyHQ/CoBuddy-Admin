import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { policyApi } from '../api';
import { toast } from 'sonner';
import { PolicyDocument } from '../types';

export const usePolicyDocs = () => {
  const queryClient = useQueryClient();

  const policiesQuery = useQuery({
    queryKey: ['policy-docs'],
    queryFn: policyApi.getPolicies,
  });

  const logsQuery = useQuery({
    queryKey: ['consent-logs'],
    queryFn: policyApi.getConsentLogs,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PolicyDocument['publishStatus'] }) => policyApi.updatePolicyStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['policy-docs'] });
      toast.success(`Policy status updated to ${status}`);
    },
  });

  return {
    policies: policiesQuery.data ?? [],
    consentLogs: logsQuery.data ?? [],
    isLoading: policiesQuery.isLoading || logsQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
  };
};
