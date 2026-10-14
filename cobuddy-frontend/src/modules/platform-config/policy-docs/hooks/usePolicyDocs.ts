import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { policyApi } from '../api';
import { toast } from 'sonner';
import { PolicyDocument, LegalSettings } from '../types';

export const usePolicyDocs = () => {
  const queryClient = useQueryClient();

  const policiesQuery = useQuery({
    throwOnError: true,
    meta: { workflow: true },
    queryKey: ['policy-docs'],
    queryFn: policyApi.getPolicies,
  });

  const logsQuery = useQuery({
    throwOnError: true,
    meta: { workflow: true },
    queryKey: ['consent-logs'],
    queryFn: policyApi.getConsentLogs,
  });

  const settingsQuery = useQuery({
    throwOnError: true,
    meta: { workflow: true },
    queryKey: ['legal-settings'],
    queryFn: policyApi.getSettings,
  });

  const updateStatusMutation = useMutation({
    meta: { workflow: true },
    mutationFn: ({ id, status }: { id: string; status: PolicyDocument['publishStatus'] }) =>
      policyApi.updatePolicyStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['policy-docs'] });
      toast.success(`Policy status updated to ${status}`);
    },
  });

  const updateSettingsMutation = useMutation({
    meta: { workflow: true },
    mutationFn: (settings: LegalSettings) => policyApi.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-settings'] });
      toast.success('Legal settings updated successfully');
    },
  });

  const createDocumentMutation = useMutation({
    meta: { workflow: true },
    mutationFn: (
      data: Omit<
        PolicyDocument,
        'id' | 'publishStatus' | 'lastUpdated' | 'consentCount' | 'version'
      >,
    ) => policyApi.createDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy-docs'] });
      toast.success('Document created successfully');
    },
  });

  const editMutation = useMutation({
    meta: { workflow: true },
    mutationFn: policyApi.updateDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy-docs'] });
      toast.success('Draft updated');
    },
  });
  return {
    updateDocument: editMutation.mutateAsync,
    policies: policiesQuery.data ?? [],
    consentLogs: logsQuery.data ?? [],
    settings: settingsQuery.data,
    isLoading: policiesQuery.isLoading || logsQuery.isLoading || settingsQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
    updateSettings: updateSettingsMutation.mutate,
    isUpdatingSettings: updateSettingsMutation.isPending,
    createDocument: createDocumentMutation.mutateAsync,
  };
};
