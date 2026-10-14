import { useMutation, useQueryClient } from '@tanstack/react-query';
import { verificationApi } from '../api';
import { toast } from 'sonner';
import { DecisionPayload } from '../types';
import { isAxiosError } from 'axios';

export const useSubmitDecision = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: DecisionPayload) => verificationApi.submitDecision(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['verification-cases'] });
      toast.success('Decision submitted successfully');
    },
    onError: (error) => {
      const message = isAxiosError(error) ? error.response?.data?.error?.message : undefined;
      toast.error(typeof message === 'string' ? message : 'Failed to submit decision');
      if (isAxiosError(error) && error.response?.status === 409)
        void queryClient.invalidateQueries({ queryKey: ['verification-cases'] });
    },
  });

  return {
    submitDecision: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
