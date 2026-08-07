import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configApi } from '../api';
import { SystemConfig } from '../types';
import { toast } from 'sonner';

export const useSystemConfig = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['system-config'],
    queryFn: configApi.getConfig,
  });

  const mutation = useMutation({
    mutationFn: (data: SystemConfig) => configApi.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      toast.success('Configuration saved successfully');
    },
    onError: () => toast.error('Failed to save configuration')
  });

  const updateMultiplierMutation = useMutation({
    mutationFn: ({ id, multiplier }: { id: string, multiplier: number }) => configApi.updateActivityMultiplier(id, multiplier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interests'] });
      toast.success('Multiplier updated successfully');
    },
    onError: () => toast.error('Failed to update multiplier')
  });

  return {
    config: query.data,
    isLoading: query.isLoading,
    saveConfig: mutation.mutate,
    isSaving: mutation.isPending,
    updateActivityMultiplier: updateMultiplierMutation.mutate
  };
};
