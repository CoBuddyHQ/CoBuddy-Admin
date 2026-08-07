import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cityLaunchApi } from '../api';
import { toast } from 'sonner';
import { CityLaunch } from '../types';

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

  return {
    launches: launchesQuery.data ?? [],
    isLoading: launchesQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
    toggleTask: toggleTaskMutation.mutate,
  };
};
