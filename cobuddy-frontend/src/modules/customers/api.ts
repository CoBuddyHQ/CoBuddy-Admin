import { CustomerRecord, BookingHistoryEntry, TransactionEntry } from './types';
import axios from '@/lib/api/client';
import type { Paginated } from '@/types/pagination';

const mapCustomer = (item: any): CustomerRecord => ({
  id: item.id,
  name: item.name,
  email: item.email || '',
  phone: item.phone,
  joinDate: item.joinDate || item.createdAt,
  verificationStatus: item.verificationStatus,
  totalBookings: item.totalBookings ?? 0,
  walletBalance: Number(item.walletBalance ?? 0),
  flags: item.flagsCount ?? 0,
  status: item.status,
});

export const customersApi = {
  getCustomers: async (page = 1): Promise<Paginated<CustomerRecord>> => {
    const res = await axios.get('/customers', { params: { page, pageSize: 20 } });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return { data: items.map(mapCustomer), meta: res.data.meta };
  },
  getCustomerById: async (id: string): Promise<CustomerRecord | undefined> => {
    const res = await axios.get(`/customers/${id}`);
    return mapCustomer(res.data.data);
  },
  updateStatus: async (id: string, status: CustomerRecord['status']): Promise<void> => {
    await axios.patch(`/customers/${id}/status`, { status });
  },
  getBookingHistory: async (id: string, page = 1): Promise<Paginated<BookingHistoryEntry>> => {
    const res = await axios.get(`/customers/${id}/booking-history`, {
      params: { page, pageSize: 20 },
    });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return {
      meta: res.data.meta,
      data: items.map((b: any) => ({
        id: b.id,
        date: b.startTime || b.createdAt,
        companionName: b.companion?.name ?? 'N/A',
        activity: b.activityLabel,
        venue: b.venueSnapshot?.name ?? b.venueId ?? '',
        status: b.status,
        amount: Number(b.bookingAmount ?? 0),
      })),
    };
  },
  getTransactionHistory: async (id: string, page = 1): Promise<Paginated<TransactionEntry>> => {
    const res = await axios.get(`/customers/${id}/transactions`, {
      params: { page, pageSize: 20 },
    });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return {
      meta: res.data.meta,
      data: items.map((t: any) => ({
        id: t.id,
        date: t.createdAt,
        type: t.transactionType,
        amount: Number(t.amount ?? 0),
        description: t.description,
      })),
    };
  },
};
