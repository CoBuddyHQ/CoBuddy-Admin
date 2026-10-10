import { BookingStatus, Prisma, TransactionStatus } from '@prisma/client';
import { WalletsService } from './wallets.service';

function setup() {
  const booking: any = {
    id: 'booking-1',
    bookingRef: 'BOOK-1',
    status: BookingStatus.COMPLETED,
    escrowReleaseAt: new Date(0),
    customerId: 'customer-1',
    companionId: 'companion-1',
    platformFeeAmount: new Prisma.Decimal(20),
    companionNetAmount: new Prisma.Decimal(80),
  };
  const debit: any = {
    id: 'debit-1',
    amount: new Prisma.Decimal(100),
    metadata: { original: 'preserved' },
    status: TransactionStatus.SUCCESS,
  };
  const wallets: any = {
    customer: { id: 'customer-wallet', currency: 'INR', balance: new Prisma.Decimal(0) },
    companion: { id: 'companion-wallet', currency: 'INR', balance: new Prisma.Decimal(40) },
    platform: { id: 'platform-wallet', currency: 'INR', balance: new Prisma.Decimal(10) },
  };
  const credits: any[] = [];
  const tx: any = {
    $queryRaw: jest.fn(async () => [{ id: booking.id }]),
    booking: { findUnique: jest.fn(async () => booking), update: jest.fn(async () => booking) },
    wallet: {
      findUnique: jest.fn(async ({ where }: any) =>
        where.customerId ? wallets.customer : wallets.companion,
      ),
      findFirst: jest.fn(async () => wallets.platform),
      upsert: jest.fn(async () => wallets.platform),
      update: jest.fn(async ({ where, data }: any) => {
        const wallet = Object.values(wallets).find((item: any) => item.id === where.id) as any;
        wallet.balance = wallet.balance.plus(data.balance.increment);
        return { ...wallet };
      }),
    },
    walletTransaction: {
      findFirst: jest.fn(async ({ where }: any) =>
        where.transactionType === 'DEBIT' ? debit : (credits[0] ?? null),
      ),
      update: jest.fn(async ({ data }: any) => {
        debit.metadata = data.metadata;
        return debit;
      }),
      create: jest.fn(async ({ data }: any) => {
        const credit = { id: 'credit-' + credits.length, ...data };
        credits.push(credit);
        return credit;
      }),
    },
    companion: { update: jest.fn(async () => ({})) },
  };
  const prisma = { $transaction: jest.fn(async (callback: any, _options: any) => callback(tx)) };
  const service = new WalletsService(prisma as any);
  const admin = { sub: 'admin-1', name: 'Admin' } as any;
  return { service, prisma, tx, booking, debit, wallets, credits, admin };
}

describe('Escrow release integrity', () => {
  it('excludes released funds from both the paginated queue and stale release batch', async () => {
    const prisma = {
      booking: { count: jest.fn(async () => 0), findMany: jest.fn(async () => []) },
      $transaction: jest.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
    };
    const service = new WalletsService(prisma as any);
    await service.listEscrow({ page: 2, pageSize: 20 }, {});
    await service.releaseStaleEscrow({ sub: 'admin' } as any);
    for (const [query] of prisma.booking.findMany.mock.calls as unknown as Array<
      [Prisma.BookingFindManyArgs]
    >) {
      expect(query.where).toMatchObject({
        walletTransactions: {
          some: { transactionType: 'DEBIT', category: 'BOOKING_CHARGE', status: 'SUCCESS' },
          none: { status: 'SUCCESS', metadata: { path: ['escrowReleased'], equals: true } },
        },
      });
    }
    expect(prisma.booking.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ walletTransactions: expect.any(Object) }),
      }),
    );
  });

  it('marks the original debit and rejects a repeated release without a second credit', async () => {
    const { service, prisma, tx, debit, credits, wallets, admin } = setup();
    await service.releaseEscrow('booking-1', admin);
    expect(debit.metadata).toMatchObject({
      escrowReleased: true,
      original: 'preserved',
      releasedBy: admin.sub,
    });
    expect(credits).toHaveLength(2);
    expect(credits[0].balanceAfter.equals(120)).toBe(true);
    expect(credits[1].balanceAfter.equals(30)).toBe(true);
    await expect(service.releaseEscrow('booking-1', admin)).rejects.toThrow('already released');
    expect(credits).toHaveLength(2);
    expect(wallets.companion.balance.equals(120)).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(tx.$queryRaw).toHaveBeenCalled();
  });

  it('rejects legacy release credits even when the original debit was not marked', async () => {
    const { service, credits, tx, admin } = setup();
    credits.push({ metadata: { escrowReleased: true } });
    await expect(service.releaseEscrow('booking-1', admin)).rejects.toThrow('already released');
    expect(tx.wallet.update).not.toHaveBeenCalled();
  });

  it.each([BookingStatus.IN_PROGRESS, BookingStatus.CUSTOMER_CANCELLED])(
    'refuses payout for %s bookings',
    async (status) => {
      const { service, booking, tx, admin } = setup();
      booking.status = status;
      await expect(service.releaseEscrow('booking-1', admin)).rejects.toThrow('Only completed');
      expect(tx.wallet.update).not.toHaveBeenCalled();
    },
  );

  it('refuses early or unscheduled release', async () => {
    const { service, booking, admin } = setup();
    booking.escrowReleaseAt = new Date(Date.now() + 60_000);
    await expect(service.releaseEscrow('booking-1', admin)).rejects.toThrow('not due');
    booking.escrowReleaseAt = null;
    await expect(service.releaseEscrow('booking-1', admin)).rejects.toThrow('not due');
  });

  it('requires a successful debit and refuses to credit more than was collected', async () => {
    const { service, tx, debit, admin } = setup();
    debit.amount = new Prisma.Decimal(50);
    await expect(service.releaseEscrow('booking-1', admin)).rejects.toThrow(
      'covered by the original charge',
    );
    expect(tx.walletTransaction.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: TransactionStatus.SUCCESS }),
      }),
    );
    tx.walletTransaction.findFirst.mockResolvedValueOnce(null);
    await expect(service.releaseEscrow('booking-1', admin)).rejects.toThrow(
      'No successful booking charge',
    );
    expect(tx.wallet.update).not.toHaveBeenCalled();
  });

  it('retries serialization conflicts and rechecks for a concurrent successful release', async () => {
    const { service, prisma, debit, tx, admin } = setup();
    prisma.$transaction.mockImplementationOnce(async () => {
      debit.metadata.escrowReleased = true;
      throw new Prisma.PrismaClientKnownRequestError('Concurrent transaction', {
        code: 'P2034',
        clientVersion: '5.22.0',
      });
    });
    await expect(service.releaseEscrow('booking-1', admin)).rejects.toThrow('already released');
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(tx.wallet.update).not.toHaveBeenCalled();
  });
});
