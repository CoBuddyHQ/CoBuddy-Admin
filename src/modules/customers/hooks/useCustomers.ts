import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../api';
import { toast } from 'sonner';
import { CustomerRecord } from '../types';

export const useCustomers = () => {
  const queryClient = useQueryClient();

  const customersQuery = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getCustomers,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CustomerRecord['status'] }) => customersApi.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(`Customer status updated to ${status}`);
    },
  });

  return {
    customers: customersQuery.data ?? [],
    isLoading: customersQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
  };
};

export const useCustomerDetail = (id: string) => {
  const queryClient = useQueryClient();

  const customerQuery = useQuery({
    queryKey: ['customers', id],
    queryFn: () => customersApi.getCustomerById(id)
  });

  const bookingHistoryQuery = useQuery({
    queryKey: ['customers', id, 'bookings'],
    queryFn: () => customersApi.getBookingHistory(id)
  });

  const transactionHistoryQuery = useQuery({
    queryKey: ['customers', id, 'transactions'],
    queryFn: () => customersApi.getTransactionHistory(id)
  });

  // For reports, we reuse the reports API, but to keep it simple here we'll just mock it directly or import it if needed.
  // Since we don't have direct access in this hook without importing, let's just let the UI component fetch it using useReports hook.

  const updateStatusMutation = useMutation({
    mutationFn: (status: CustomerRecord['status']) => customersApi.updateStatus(id, status),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(`Customer status updated to ${status}`);
    }
  });

  return {
    customer: customerQuery.data,
    bookingHistory: bookingHistoryQuery.data,
    transactionHistory: transactionHistoryQuery.data,
    isLoading: customerQuery.isLoading || bookingHistoryQuery.isLoading || transactionHistoryQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
  };
};
