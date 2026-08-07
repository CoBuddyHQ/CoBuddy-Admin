import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../api';
import { toast } from 'sonner';

export const useEmployees = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['employees'],
    queryFn: employeeApi.getEmployees,
  });

  const addMutation = useMutation({
    mutationFn: employeeApi.addEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Staff member added and invited');
    },
    onError: () => toast.error('Failed to add staff member')
  });

  const updateRolesMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => employeeApi.updateRoles(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Roles updated');
    },
    onError: () => toast.error('Failed to update roles')
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, currentStatus }: { id: string, currentStatus: string }) => employeeApi.toggleStatus(id, currentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Status toggled');
    },
    onError: () => toast.error('Failed to toggle status')
  });

  const forceLogoutMutation = useMutation({
    mutationFn: employeeApi.forceLogout,
    onSuccess: () => toast.success('Forced logout successfully'),
    onError: () => toast.error('Failed to force logout')
  });

  return {
    employees: query.data || [],
    isLoading: query.isLoading,
    addEmployee: addMutation.mutate,
    isAdding: addMutation.isPending,
    updateRoles: updateRolesMutation.mutate,
    toggleStatus: toggleStatusMutation.mutate,
    forceLogout: forceLogoutMutation.mutate
  };
};
