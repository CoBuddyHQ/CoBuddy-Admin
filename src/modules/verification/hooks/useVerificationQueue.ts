import { useQuery } from '@tanstack/react-query';
import { verificationApi } from '../api';
import type { VerificationFilter } from '../types';

export const useVerificationQueue = ({
  status,
  page = 1,
  pageSize = 20,
  enabled = true,
}: {
  status?: VerificationFilter;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
} = {}) => {
  const query = useQuery({
    queryKey: ['verification-cases', status, page, pageSize],
    queryFn: () => verificationApi.getCases(status, page, pageSize),
    enabled,
  });

  return {
    ...query,
    cases: query.data?.data ?? [],
    meta: query.data?.meta,
  };
};
