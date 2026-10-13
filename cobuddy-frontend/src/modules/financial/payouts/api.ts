import axios from '@/lib/api/client';
import type { PayoutAction, PayoutPage, PayoutStatus } from './types';

export const payoutsApi = {
  getPayouts: async (page = 1, status?: PayoutStatus): Promise<PayoutPage> => {
    const response = await axios.get<PayoutPage>('/financial/payouts', {
      params: { page, pageSize: 20, status },
    });
    return response.data;
  },
  updatePayout: async ({ id, action, ...body }: PayoutAction): Promise<void> => {
    await axios.post('/financial/payouts/' + encodeURIComponent(id) + '/' + action, body);
  },
};
