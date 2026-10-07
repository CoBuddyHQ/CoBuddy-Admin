import { Prisma, RefundStatus } from '@prisma/client';
import { RefundsService } from './refunds.service';

describe('Refund processing ledger safety', () => {
  function fixture() {
    let status: RefundStatus = RefundStatus.APPROVED;
    let balance = new Prisma.Decimal('10.10');
    const refund = { id: 'refund-1', bookingId: 'booking-1', amount: new Prisma.Decimal('0.20') };
    const tx: any = {
      refund: {
        updateMany: jest.fn(async ({ where, data }: any) => {
          if (status !== where.status) return { count: 0 };
          status = data.status;
          return { count: 1 };
        }),
        findUnique: jest.fn(async () => ({ ...refund, status })),
      },
      wallet: {
        update: jest.fn(async ({ data }: any) => {
          balance = balance.add(data.balance.increment);
          return { id: 'wallet-1', balance };
        }),
      },
      walletTransaction: { create: jest.fn(async ({ data }: any) => data) },
      customer: { update: jest.fn() },
      bookingDispute: { updateMany: jest.fn() },
    };
    const db: any = {
      refund: { findUnique: jest.fn(async () => ({ ...refund, status })) },
      booking: {
        findUnique: jest.fn(async () => ({
          id: 'booking-1',
          bookingRef: 'B-1',
          customerId: 'customer-1',
        })),
      },
      wallet: { findFirst: jest.fn(async () => ({ id: 'wallet-1', balance })) },
      $transaction: (callback: any) => callback(tx),
    };
    return { service: new RefundsService(db), tx, balance: () => balance };
  }

  it('credits a concurrently requested refund only once', async () => {
    const { service, tx, balance } = fixture();
    const user = { sub: 'admin-1', name: 'Admin' } as any;
    const results = await Promise.allSettled([
      service.process('refund-1', user),
      service.process('refund-1', user),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(tx.wallet.update).toHaveBeenCalledTimes(1);
    expect(tx.walletTransaction.create).toHaveBeenCalledTimes(1);
    expect(balance().toFixed(2)).toBe('10.30');
  });

  it('uses the updated wallet balance for both ledger and cached customer balance', async () => {
    const { service, tx } = fixture();
    await service.process('refund-1', { sub: 'admin-1', name: 'Admin' } as any);
    const ledger = tx.walletTransaction.create.mock.calls[0][0].data;
    expect(ledger.balanceAfter.toFixed(2)).toBe('10.30');
    expect(ledger.amount.toFixed(2)).toBe('0.20');
    expect(tx.customer.update).toHaveBeenCalledWith({
      where: { id: 'customer-1' },
      data: { walletBalance: ledger.balanceAfter },
    });
    expect(tx.bookingDispute.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { refundId: 'refund-1', workflowStatus: 'REFUND_PENDING' },
        data: expect.objectContaining({ workflowStatus: 'RESOLVED_REFUND' }),
      }),
    );
  });
});
