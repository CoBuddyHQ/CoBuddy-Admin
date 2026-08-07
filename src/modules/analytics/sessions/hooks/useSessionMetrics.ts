import { useQuery } from '@tanstack/react-query';
import { sessionsApi } from '../api';

export const useSessionMetrics = () => {
  const query = useQuery({ queryKey: ['session-metrics'], queryFn: sessionsApi.getMetrics });

  return {
    metrics: query.data,
    isLoading: query.isLoading,
  };
};
