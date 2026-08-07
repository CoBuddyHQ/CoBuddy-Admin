import { useQuery } from '@tanstack/react-query';
import { growthApi } from '../api';

export const useGrowthStats = () => {
  const query = useQuery({ queryKey: ['growth-stats'], queryFn: growthApi.getStats });

  return {
    stats: query.data,
    isLoading: query.isLoading,
  };
};
