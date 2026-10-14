import { useQuery } from '@tanstack/react-query';
import { revenueApi } from '../api';

export const useRevenueStats = () => {
  const query = useQuery({ queryKey: ['revenue-stats'], queryFn: revenueApi.getStats });

  return {
    stats: query.data,
    isLoading: query.isLoading,
  };
};
