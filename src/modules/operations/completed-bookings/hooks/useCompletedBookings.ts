import { useQuery } from '@tanstack/react-query';
import { completedBookingsApi } from '../api';

export const useCompletedBookings = () => {
  const query = useQuery({ queryKey: ['completed-bookings'], queryFn: completedBookingsApi.getBookings });

  return {
    bookings: query.data || [],
    isLoading: query.isLoading,
  };
};
