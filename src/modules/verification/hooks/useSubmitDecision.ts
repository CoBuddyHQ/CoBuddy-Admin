import { useMutation, useQueryClient } from '@tanstack/react-query';
import { verificationApi } from '../api';
import { toast } from 'sonner';
import { DecisionPayload } from '../types';

export const useSubmitDecision = () => {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: DecisionPayload) => verificationApi.submitDecision(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-cases'] });
      toast.success('Decision submitted successfully');
    },
    onError: () => {
      toast.error('Failed to submit decision');
    },
  });

  return {
    submitDecision: mutate,
    isSubmitting: isPending,
  };
};
