import axios from '@/lib/api/client';
import { TaxInvoice } from './types';

const mapInvoice = (item: any): TaxInvoice => {
  const invoiceDate = new Date(item.invoiceDate);
  return {
    id: item.invoiceNumber,
    companionId: item.companionId ?? '',
    companionName: item.companionId ?? item.customerId ?? 'N/A',
    panNumber: item.taxNumber ?? '',
    period: invoiceDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    totalEarnings: Number(item.subtotal ?? 0),
    tdsDeducted: null,
    gstCollected: Number(item.gstAmount ?? 0),
    status: item.status,
  };
};

export const taxInvoicesApi = {
  getInvoices: async (): Promise<TaxInvoice[]> => {
    const response = await axios.get('/financial/tax-invoices', {
      params: { page: 1, pageSize: 100 },
    });
    const items = response.data.data?.data ?? response.data.data ?? [];
    return items.map(mapInvoice);
  },
  updateStatus: async (id: string, status: TaxInvoice['status']): Promise<void> => {
    const response = await axios.get('/financial/tax-invoices', {
      params: { page: 1, pageSize: 100 },
    });
    const invoice = (response.data.data?.data ?? response.data.data ?? []).find(
      (item: any) => item.invoiceNumber === id,
    );
    if (!invoice) throw new Error('Invoice not found');
    const action =
      status === 'ISSUED'
        ? 'issue'
        : status === 'PAID'
          ? 'mark-paid'
          : status === 'CANCELLED'
            ? 'cancel'
            : null;
    if (!action) throw new Error('Draft status cannot be restored');
    await axios.post('/financial/tax-invoices/' + invoice.id + '/' + action);
  },
};
