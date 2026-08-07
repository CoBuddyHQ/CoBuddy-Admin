import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { policyApi } from '../api';
import { toast } from 'sonner';
import { PolicyDocument, LegalSettings } from '../types';

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

  const settingsQuery = useQuery({
    queryKey: ['legal-settings'],
    queryFn: policyApi.getSettings,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PolicyDocument['publishStatus'] }) => policyApi.updatePolicyStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['policy-docs'] });
      toast.success(`Policy status updated to ${status}`);
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: LegalSettings) => policyApi.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-settings'] });
      toast.success('Legal settings updated successfully');
    },
  });

  return {
    policies: policiesQuery.data ?? [],
    consentLogs: logsQuery.data ?? [],
    settings: settingsQuery.data,
    isLoading: policiesQuery.isLoading || logsQuery.isLoading || settingsQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
    updateSettings: updateSettingsMutation.mutate,
    isUpdatingSettings: updateSettingsMutation.isPending,
  };
};
