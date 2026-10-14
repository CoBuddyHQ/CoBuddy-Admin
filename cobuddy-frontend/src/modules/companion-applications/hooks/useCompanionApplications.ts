import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companionAppApi } from '../api';
import { toast } from 'sonner';
import { ApplicationDecisionPayload, ScheduleInterviewPayload } from '../types';

export const useCompanionApplications = (status = 'ALL', page = 1) => {
  const query = useQuery({
    queryKey: ['companion-applications', 'list', status, page],
    queryFn: () => companionAppApi.getApplications(status, page),
    throwOnError: true,
    meta: { workflow: true },
  });

  return {
    applications: query.data?.data || [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isRefreshing: query.isFetching,
    refresh: query.refetch,
  };
};

export const useCompanionApplicationDetail = (id: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['companion-applications', id],
    queryFn: () => companionAppApi.getApplication(id),
    throwOnError: true,
    meta: { workflow: true },
  });

  const assignMutation = useMutation({
    mutationFn: () => companionAppApi.assignApplication(id),
    meta: { workflow: true },
    onSuccess: (application) => {
      queryClient.setQueryData(['companion-applications', id], application);
      queryClient.invalidateQueries({ queryKey: ['companion-applications'] });
      toast.success('Application assigned');
    },
  });

  const decisionMutation = useMutation({
    mutationFn: (payload: ApplicationDecisionPayload) => companionAppApi.submitDecision(payload),
    meta: { workflow: true },
    onSuccess: (application) => {
      queryClient.setQueryData(['companion-applications', id], application);
      queryClient.invalidateQueries({ queryKey: ['companion-applications'] });
      toast.success('Decision submitted');
    },
  });

  const interviewMutation = useMutation({
    mutationFn: (payload: ScheduleInterviewPayload) =>
      companionAppApi.scheduleInterview(id, payload),
    meta: { workflow: true },
    onSuccess: (application) => {
      queryClient.setQueryData(['companion-applications', id], application);
      queryClient.invalidateQueries({ queryKey: ['companion-applications'] });
      toast.success('Interview scheduled');
    },
  });

  return {
    application: query.data,
    isLoading: query.isLoading,
    assignToMe: assignMutation.mutate,
    isAssigning: assignMutation.isPending,
    submitDecision: decisionMutation.mutate,
    isSubmittingDecision: decisionMutation.isPending,
    scheduleInterview: interviewMutation.mutateAsync,
    isScheduling: interviewMutation.isPending,
  };
};
