import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportApi } from '../api';
import { toast } from 'sonner';

export const useReports = () => {
  const query = useQuery({ queryKey: ['reports'], queryFn: reportApi.getReports });
  return {
    reports: query.data || [],
    isLoading: query.isLoading
  };
};

export const useReportDetail = (id: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['report', id],
    queryFn: () => reportApi.getDetail(id)
  });

  const updateMutation = useMutation({
    mutationFn: ({ status, note, author }: { status: any, note?: string, author?: string }) => 
      reportApi.updateStatus(id, status, note, author),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['report', id] });
      toast.success('Report updated successfully');
    }
  });

  return {
    detail: query.data,
    isLoading: query.isLoading,
    updateStatus: updateMutation.mutate,
    isUpdating: updateMutation.isPending
  };
};
