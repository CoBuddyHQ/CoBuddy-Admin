import { useQuery } from '@tanstack/react-query';
import { liveMapApi } from '../api';

export const useLiveMap = () => {
  const query = useQuery({
    queryKey: ['live-bookings'],
    queryFn: liveMapApi.getLiveBookings,
    refetchInterval: 10000,
  });

  return {
    markers: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    refetch: query.refetch,
    updatedAt: query.dataUpdatedAt,
  };
};
