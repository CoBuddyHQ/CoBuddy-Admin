import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '../api';
import { toast } from 'sonner';

export const useReviews = () => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['reviews'], queryFn: reviewsApi.getReviews });

  const moderateMutation = useMutation({
    mutationFn: ({ id, action, warning }: { id: string, action: 'APPROVE' | 'REMOVE', warning?: string }) => reviewsApi.moderateReview(id, action, warning),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review moderated successfully');
    }
  });

  return {
    reviews: query.data || [],
    isLoading: query.isLoading,
    moderateReview: moderateMutation.mutate,
  };
};
