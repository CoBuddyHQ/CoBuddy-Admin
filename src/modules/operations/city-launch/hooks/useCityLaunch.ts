import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cityLaunchApi } from '../api';
import { toast } from 'sonner';
import { CityLaunch, WaitlistConfig } from '../types';

export const useCityLaunch = () => {
  const queryClient = useQueryClient();

  const launchesQuery = useQuery({
    queryKey: ['city-launches'],
    queryFn: cityLaunchApi.getLaunches,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CityLaunch['status'] }) => cityLaunchApi.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['city-launches'] });
      toast.success(`Launch status updated to ${status}`);
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: ({ cityId, taskId }: { cityId: string; taskId: string }) => cityLaunchApi.toggleChecklistTask(cityId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['city-launches'] });
    },
  });

  const configQuery = useQuery({
    queryKey: ['waitlist-config'],
    queryFn: cityLaunchApi.getConfig,
  });

  const entriesQuery = useQuery({
    queryKey: ['waitlist-entries'],
    queryFn: cityLaunchApi.getEntries,
  });

  const updateConfigMutation = useMutation({
    mutationFn: (config: WaitlistConfig) => cityLaunchApi.updateConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist-config'] });
      toast.success('Waitlist configuration updated');
    },
  });

  const approveEntryMutation = useMutation({
    mutationFn: (id: string) => cityLaunchApi.approveEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist-entries'] });
      toast.success('User approved from waitlist');
    },
  });

  return {
    launches: launchesQuery.data ?? [],
    isLoadingLaunches: launchesQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
    toggleTask: toggleTaskMutation.mutate,

    config: configQuery.data,
    entries: entriesQuery.data ?? [],
    isLoadingWaitlist: configQuery.isLoading || entriesQuery.isLoading,
    updateConfig: updateConfigMutation.mutate,
    isUpdatingConfig: updateConfigMutation.isPending,
    approveEntry: approveEntryMutation.mutate,
  };
};
