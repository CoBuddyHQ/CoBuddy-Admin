import { useQuery } from '@tanstack/react-query';
import { safetyAnalyticsApi } from '../api';

export const useSafetyAnalytics = () => {
  const query = useQuery({
    queryKey: ['analytics', 'safety'],
    queryFn: safetyAnalyticsApi.getMetrics,
  });

  return {
    metrics: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};
