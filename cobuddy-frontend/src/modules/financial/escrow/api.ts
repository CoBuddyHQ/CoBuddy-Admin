import axios from '@/lib/api/client';
import type { EscrowRecord, Page, WalletRecord } from './types';

export const escrowApi = {
  getRecords: async (page = 1): Promise<Page<EscrowRecord>> => {
    const response = await axios.get<Page<EscrowRecord>>('/financial/escrow', {
      params: { page, pageSize: 20 },
    });
    return response.data;
  },
  getWallets: async (page = 1): Promise<Page<WalletRecord>> => {
    const response = await axios.get<Page<WalletRecord>>('/financial/wallets', {
      params: { page, pageSize: 20 },
    });
    return response.data;
  },
  releaseEscrow: async (bookingId: string): Promise<void> => {
    // The server derives the full release amount from the charged booking.
    await axios.post('/financial/escrow/' + encodeURIComponent(bookingId) + '/release');
  },
};
