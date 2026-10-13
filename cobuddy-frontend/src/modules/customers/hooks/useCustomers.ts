import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../api';
import { toast } from 'sonner';
import { CustomerRecord } from '../types';
import { useState } from 'react';

export const useCustomers = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const customersQuery = useQuery({
    queryKey: ['customers', 'list', page],
    queryFn: () => customersApi.getCustomers(page),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CustomerRecord['status'] }) =>
      customersApi.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(`Customer status updated to ${status}`);
    },
    onError: () => toast.error('Could not update customer status'),
  });

  return {
    customers: customersQuery.data?.data ?? [],
    meta: customersQuery.data?.meta,
    page,
    setPage,
    isError: customersQuery.isError,
    refetch: customersQuery.refetch,
    isLoading: customersQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
  };
};

export const useCustomerDetail = (id: string) => {
  const queryClient = useQueryClient();
  const [bookingPage, setBookingPage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);

  const customerQuery = useQuery({
    queryKey: ['customers', id],
    queryFn: () => customersApi.getCustomerById(id),
  });

  const bookingHistoryQuery = useQuery({
    queryKey: ['customers', id, 'bookings', bookingPage],
    queryFn: () => customersApi.getBookingHistory(id, bookingPage),
  });

  const transactionHistoryQuery = useQuery({
    queryKey: ['customers', id, 'transactions', transactionPage],
    queryFn: () => customersApi.getTransactionHistory(id, transactionPage),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: CustomerRecord['status']) => customersApi.updateStatus(id, status),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(`Customer status updated to ${status}`);
    },
  });

  return {
    customer: customerQuery.data,
    bookingHistory: bookingHistoryQuery.data?.data,
    transactionHistory: transactionHistoryQuery.data?.data,
    bookingMeta: bookingHistoryQuery.data?.meta,
    bookingPage,
    setBookingPage,
    transactionMeta: transactionHistoryQuery.data?.meta,
    transactionPage,
    setTransactionPage,
    historyPending: bookingHistoryQuery.isFetching || transactionHistoryQuery.isFetching,
    historyError: bookingHistoryQuery.isError || transactionHistoryQuery.isError,
    retryHistory: () => {
      void bookingHistoryQuery.refetch();
      void transactionHistoryQuery.refetch();
    },
    isLoading: customerQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
  };
};
