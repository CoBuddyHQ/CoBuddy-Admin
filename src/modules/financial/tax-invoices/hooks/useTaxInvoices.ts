import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxInvoicesApi } from '../api';
import { toast } from 'sonner';
import { TaxInvoice } from '../types';

export const useTaxInvoices = () => {
  const queryClient = useQueryClient();

  const invoicesQuery = useQuery({
    queryKey: ['tax-invoices'],
    queryFn: taxInvoicesApi.getInvoices,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaxInvoice['status'] }) => taxInvoicesApi.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['tax-invoices'] });
      toast.success(`Invoice status updated to ${status}`);
    },
  });

  return {
    invoices: invoicesQuery.data ?? [],
    isLoading: invoicesQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
  };
};
