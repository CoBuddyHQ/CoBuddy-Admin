import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponsApi } from '../api';
import { toast } from 'sonner';

export const useCoupons = () => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['coupons'], queryFn: couponsApi.getCoupons });

  const createMutation = useMutation({
    mutationFn: couponsApi.createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon created successfully');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: couponsApi.toggleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon status toggled');
    }
  });

  return {
    coupons: query.data || [],
    isLoading: query.isLoading,
    createCoupon: createMutation.mutate,
    isCreating: createMutation.isPending,
    toggleStatus: toggleMutation.mutate
  };
};
