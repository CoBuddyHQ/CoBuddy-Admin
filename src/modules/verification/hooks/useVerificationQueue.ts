import { useQuery } from '@tanstack/react-query';
import { verificationApi } from '../api';
import { VerificationCase } from '../types';

export const useVerificationQueue = (statusFilter?: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['verification-cases', statusFilter],
    queryFn: () => verificationApi.getCases(statusFilter),
  });

  return {
    cases: (data as VerificationCase[]) || [],
    isLoading,
    error,
  };
};
