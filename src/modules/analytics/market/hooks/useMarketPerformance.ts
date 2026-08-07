import { useQuery } from '@tanstack/react-query';
import { marketApi } from '../api';

export const useMarketPerformance = () => {
  const query = useQuery({ queryKey: ['market-performance'], queryFn: marketApi.getPerformance });

  return {
    performance: query.data || [],
    isLoading: query.isLoading,
  };
};
