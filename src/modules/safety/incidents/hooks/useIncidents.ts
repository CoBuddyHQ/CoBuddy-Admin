import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentsApi } from '../api';
import { toast } from 'sonner';

export const useIncidents = () => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['incidents'], queryFn: incidentsApi.getIncidents });

  return {
    incidents: query.data || [],
    isLoading: query.isLoading,
  };
};

export const useIncidentDetail = (id: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['incident', id],
    queryFn: () => incidentsApi.getDetail(id)
  });

  const updateMutation = useMutation({
    mutationFn: ({ status, note, author }: { status: any, note?: string, author?: string }) => 
      incidentsApi.updateStatus(id, status, note, author),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
      toast.success('Incident updated successfully');
    }
  });

  return {
    detail: query.data,
    isLoading: query.isLoading,
    updateStatus: updateMutation.mutate,
    isUpdating: updateMutation.isPending
  };
};
