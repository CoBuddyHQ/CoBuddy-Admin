import { CouponCode } from './types';

let mockCoupons: CouponCode[] = [
  { id: 'C-01', code: 'WELCOME50', discountType: 'FLAT', discountValue: 50, maxUses: 1000, currentUses: 450, validFrom: new Date(Date.now() - 864000000).toISOString(), validTo: new Date(Date.now() + 864000000).toISOString(), status: 'ACTIVE' },
  { id: 'C-02', code: 'SUMMER20', discountType: 'PERCENTAGE', discountValue: 20, maxUses: 500, currentUses: 500, validFrom: new Date(Date.now() - 1864000000).toISOString(), validTo: new Date(Date.now() - 86400000).toISOString(), status: 'EXPIRED' },
];

export const couponsApi = {
  getCoupons: async (): Promise<CouponCode[]> => Promise.resolve([...mockCoupons]),
  createCoupon: async (coupon: Omit<CouponCode, 'id' | 'currentUses' | 'status'>): Promise<void> => {
    mockCoupons.unshift({
      ...coupon,
      id: `C-${Math.floor(Math.random() * 1000)}`,
      currentUses: 0,
      status: 'ACTIVE'
    });
    return Promise.resolve();
  },
  toggleStatus: async (id: string): Promise<void> => {
    const c = mockCoupons.find(x => x.id === id);
    if (c && c.status !== 'EXPIRED') {
      c.status = c.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    }
    return Promise.resolve();
  }
};
