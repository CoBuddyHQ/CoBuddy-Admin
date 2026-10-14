import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../api';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { useState } from 'react';
import type { Employee } from '../types';
import type { PaginationMeta } from '@/types/pagination';

export const useEmployees = (paginated = false) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [department, setDepartment] = useState<Employee['department'] | undefined>();

  const query = useQuery<{ data: Employee[]; meta?: PaginationMeta }>({
    queryKey: ['employees', paginated ? page : 'directory', department],
    queryFn: () =>
      paginated
        ? employeeApi.getPage(page, 20, department)
        : employeeApi.getEmployees().then((data) => ({ data, meta: undefined })),
  });

  const addMutation = useMutation({
    mutationFn: employeeApi.addEmployee,
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      if (employee.invitationDelivery === 'SENT')
        toast.success('Staff member created and invitation sent');
      else
        toast.warning(
          'Staff created, but invitation was not delivered. Configure email and resend.',
        );
    },
    onError: () => toast.error('Failed to add staff member'),
  });

  const updateRolesMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => employeeApi.updateRoles(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Roles updated');
    },
    onError: () => toast.error('Failed to update roles'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, currentStatus }: { id: string; currentStatus: string }) =>
      employeeApi.toggleStatus(id, currentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Status toggled');
    },
    onError: () => toast.error('Failed to toggle status'),
  });

  const forceLogoutMutation = useMutation({
    mutationFn: employeeApi.forceLogout,
    onSuccess: async (sessionsRemoved) => {
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(`Revoked ${sessionsRemoved} active session${sessionsRemoved === 1 ? '' : 's'}`);
    },
    onError: (error) => {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      const message = isAxiosError(error) ? error.response?.data?.error?.message : undefined;
      toast.error(
        status === 401
          ? 'Admin session expired. Sign in again, then retry.'
          : status === 404
            ? 'Force logout endpoint was not found. Restart the backend and try the Force Logout button again.'
            : message || 'Could not revoke employee sessions.',
      );
    },
  });

  const resendMutation = useMutation({
    mutationFn: employeeApi.resendInvite,
    onSuccess: (delivery) =>
      delivery === 'SENT'
        ? toast.success('Invitation sent')
        : toast.error('Invitation not delivered. Check email configuration.'),
    onError: () => toast.error('Could not resend invitation'),
  });

  return {
    employees: query.data?.data || [],
    meta: query.data?.meta,
    page,
    setPage,
    isError: query.isError,
    refetch: query.refetch,
    department,
    changeDepartment: (value?: Employee['department']) => {
      setPage(1);
      setDepartment(value);
    },
    isLoading: query.isLoading,
    addEmployee: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    updateRoles: updateRolesMutation.mutate,
    isUpdatingRoles: updateRolesMutation.isPending,
    toggleStatus: toggleStatusMutation.mutate,
    forceLogout: forceLogoutMutation.mutate,
    resendInvite: resendMutation.mutate,
  };
};
