import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companionAppApi } from '../api';
import { toast } from 'sonner';
import { ApplicationDecisionPayload } from '../types';

export const useCompanionApplications = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['companion-applications'],
    queryFn: companionAppApi.getApplications,
  });

  return {
    applications: query.data || [],
    isLoading: query.isLoading,
  };
};

export const useCompanionApplicationDetail = (id: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['companion-applications', id],
    queryFn: () => companionAppApi.getApplication(id),
  });

  const assignMutation = useMutation({
    mutationFn: (staffName: string) => companionAppApi.assignApplication(id, staffName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companion-applications'] });
      toast.success('Application assigned');
    },
    onError: () => toast.error('Failed to assign application')
  });

  const decisionMutation = useMutation({
    mutationFn: (payload: ApplicationDecisionPayload) => companionAppApi.submitDecision(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companion-applications'] });
      toast.success('Decision submitted');
    },
    onError: () => toast.error('Failed to submit decision')
  });

  return {
    application: query.data,
    isLoading: query.isLoading,
    assignToMe: assignMutation.mutate,
    isAssigning: assignMutation.isPending,
    submitDecision: decisionMutation.mutate,
    isSubmittingDecision: decisionMutation.isPending,
  };
};
