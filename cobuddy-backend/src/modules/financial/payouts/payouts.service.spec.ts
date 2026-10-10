import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, PayoutStatus } from '@prisma/client';
import { PayoutsService } from './payouts.service';

describe('Payout state transitions', () => {
  const user = { sub: 'finance-1', name: 'Finance' } as any;
  function fixture(status: PayoutStatus = PayoutStatus.PENDING, verified = true) {
    let row: any = {
      id: 'payout-1',
      companionId: 'companion-1',
      status,
      amount: new Prisma.Decimal('100.25'),
      updatedAt: new Date('2026-01-01'),
    };
    const payout = {
      findUnique: jest.fn(async (_query: any) => (row ? { ...row } : null)),
      findUniqueOrThrow: jest.fn(async () => ({ ...row })),
      updateMany: jest.fn(async ({ where, data }: any) => {
        if (
          !row ||
          row.status !== where.status ||
          row.updatedAt !== where.updatedAt ||
          (where.bankAccount && !verified)
        )
          return { count: 0 };
        row = { ...row, ...data, updatedAt: new Date() };
        return { count: 1 };
      }),
      findMany: jest.fn(async (_query: any) => []),
      count: jest.fn(async () => 0),
    };
    const db: any = { payout, $transaction: (callback: any) => callback({ payout }) };
    return {
      service: new PayoutsService(db),
      payout,
      row: () => row,
      remove: () => {
        row = null;
      },
    };
  }

  it('claims a concurrent process request only once', async () => {
    const { service, row } = fixture();
    const results = await Promise.allSettled([
      service.process('payout-1', {}, user),
      service.process('payout-1', {}, user),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(row().status).toBe(PayoutStatus.PROCESSING);
  });

  it('does not let concurrent hold and process requests overwrite one another', async () => {
    const { service } = fixture();
    const results = await Promise.allSettled([
      service.hold('payout-1', { reason: 'Account review' }, user),
      service.process('payout-1', {}, user),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
  });

  it.each([PayoutStatus.ON_HOLD, PayoutStatus.PROCESSING, PayoutStatus.PAID])(
    'rejects processing from %s',
    async (status) => {
      const { service, payout } = fixture(status);
      await expect(service.process('payout-1', {}, user)).rejects.toThrow(BadRequestException);
      expect(payout.updateMany).not.toHaveBeenCalled();
    },
  );

  it('requires a verified bank account belonging to the payout companion', async () => {
    const { service, payout, row } = fixture(PayoutStatus.PENDING, false);
    await expect(service.process('payout-1', {}, user)).rejects.toThrow(ConflictException);
    expect(payout.updateMany.mock.calls[0][0].where.bankAccount).toEqual({
      is: { verified: true, companionId: 'companion-1' },
    });
    expect(row().status).toBe(PayoutStatus.PENDING);
  });

  it('refuses a non-positive payout', async () => {
    const { service, payout, row } = fixture();
    row().amount = new Prisma.Decimal('-1');
    await expect(service.process('payout-1', {}, user)).rejects.toThrow(BadRequestException);
    expect(payout.updateMany).not.toHaveBeenCalled();
  });

  it('lifts a hold before processing, and records a payment only from PROCESSING', async () => {
    const { service, row } = fixture(PayoutStatus.ON_HOLD);
    await expect(service.markPaid('payout-1', { utrNumber: 'UTR-123' }, user)).rejects.toThrow(
      BadRequestException,
    );
    await service.liftHold('payout-1', user);
    await service.process('payout-1', {}, user);
    await service.markPaid('payout-1', { utrNumber: 'UTR-123' }, user);
    expect(row()).toMatchObject({
      status: PayoutStatus.PAID,
      utrNumber: 'UTR-123',
      paidByAdminId: 'finance-1',
    });
    await expect(service.hold('payout-1', { reason: 'Review' }, user)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.markFailed('payout-1', 'Failed', user)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('clears stale failure and transfer references before retrying', async () => {
    const { service, row } = fixture(PayoutStatus.FAILED);
    Object.assign(row(), {
      failureMessage: 'Previous failure',
      utrNumber: 'old',
      gatewayPayoutId: 'old',
      processedAt: new Date(),
    });
    await service.process('payout-1', {}, user);
    expect(row()).toMatchObject({
      status: PayoutStatus.PROCESSING,
      failureMessage: null,
      utrNumber: null,
      gatewayPayoutId: null,
      processedAt: null,
    });
  });

  it('rejects a concurrent update without modifying the payout', async () => {
    const { service, payout } = fixture();
    payout.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(service.hold('payout-1', { reason: 'Review' }, user)).rejects.toThrow(
      ConflictException,
    );
    expect(payout.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it('reports missing records', async () => {
    const { service, remove } = fixture();
    remove();
    await expect(service.process('missing', {}, user)).rejects.toThrow(NotFoundException);
  });

  it('returns verification status but does not select full bank account numbers', async () => {
    const { service, payout } = fixture();
    await service.list({ page: 1, pageSize: 20 });
    await service.getOne('payout-1');
    for (const select of [
      payout.findMany.mock.calls[0][0].include.bankAccount.select,
      payout.findUnique.mock.calls[0][0].include.bankAccount.select,
    ]) {
      expect(select.verified).toBe(true);
      expect(select.accountNumber).toBeUndefined();
      expect(select.accountLast4).toBe(true);
    }
  });
});
