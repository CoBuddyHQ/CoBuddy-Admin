import { useQuery } from '@tanstack/react-query';
import { cancelledBookingsApi } from '../api';

export const useCancelledBookings = () => {
  const query = useQuery({
    queryKey: ['cancelled-bookings'],
    queryFn: cancelledBookingsApi.getBookings,
    refetchInterval: 2000,
  });

  return {
    bookings: query.data || [],
    isLoading: query.isLoading,
  };
};
