import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../api';
import { toast } from 'sonner';
import { CustomRole } from '../types';

export const useRoles = () => {
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['customRoles'],
    queryFn: employeeApi.getCustomRoles
  });

  const { mutate: addRole } = useMutation({
    mutationFn: (data: Omit<CustomRole, 'id' | 'createdAt'>) => employeeApi.addCustomRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customRoles'] });
      toast.success('Custom role created successfully');
    }
  });

  const { mutate: deleteRole } = useMutation({
    mutationFn: (id: string) => employeeApi.deleteCustomRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customRoles'] });
      toast.success('Custom role deleted');
    }
  });

  return {
    roles,
    isLoading,
    addRole,
    deleteRole
  };
};
