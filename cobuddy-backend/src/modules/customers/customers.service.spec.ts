import { BadRequestException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CompanionsService } from '../companions/companions.service';
import {
  CUSTOMER_PUBLIC_SELECT,
  COMPANION_PUBLIC_SELECT,
  BANK_ACCOUNT_PUBLIC_SELECT,
} from '@/common/public-selects';

describe('Directory responses and wallet adjustments', () => {
  it('uses explicit public selects for customer reads and mutations', async () => {
    const db: any = {
      customer: {
        findUnique: jest.fn().mockResolvedValue({ id: 'c' }),
        update: jest.fn().mockResolvedValue({ id: 'c' }),
      },
    };
    const service = new CustomersService(db);
    await service.findOne('c');
    await service.updateStatus('c', { status: 'SUSPENDED' });
    await service.updateVerificationStatus('c', { verificationStatus: 'VERIFIED' });
    expect(db.customer.findUnique.mock.calls[0][0].select).toMatchObject(CUSTOMER_PUBLIC_SELECT);
    for (const [query] of db.customer.update.mock.calls)
      expect(query.select).toEqual(CUSTOMER_PUBLIC_SELECT);
    expect(CUSTOMER_PUBLIC_SELECT).not.toHaveProperty('passwordHash');
  });

  it('never selects companion passwords or full bank account numbers', async () => {
    const db: any = {
      companion: { findUnique: jest.fn().mockResolvedValue({ id: 'c' }) },
      bankAccount: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue({ id: 'bank' }),
        update: jest.fn().mockResolvedValue({ id: 'bank' }),
      },
    };
    const service = new CompanionsService(db);
    await service.findOne('c');
    await service.getBankAccounts('c');
    await service.approveBankAccount('c', 'bank');
    expect(db.companion.findUnique.mock.calls[0][0].select.bankAccounts.select).toEqual(
      BANK_ACCOUNT_PUBLIC_SELECT,
    );
    expect(db.bankAccount.findMany.mock.calls[0][0].select).toEqual(BANK_ACCOUNT_PUBLIC_SELECT);
    expect(db.bankAccount.update.mock.calls[0][0].select).toEqual(BANK_ACCOUNT_PUBLIC_SELECT);
    expect(COMPANION_PUBLIC_SELECT).not.toHaveProperty('passwordHash');
    expect(BANK_ACCOUNT_PUBLIC_SELECT).not.toHaveProperty('accountNumber');
  });

  it('allows only one of two competing debits when funds cover just one', async () => {
    let balance = 100;
    const db: any = {
      customer: { findUnique: jest.fn().mockResolvedValue({ id: 'c' }), update: jest.fn() },
      wallet: {
        upsert: jest.fn().mockResolvedValue({ id: 'wallet' }),
        updateMany: jest.fn(async ({ where, data }) => {
          if (balance < Number(where.balance.gte)) return { count: 0 };
          balance -= Number(data.balance.decrement);
          return { count: 1 };
        }),
        findUniqueOrThrow: jest.fn(async () => ({ id: 'wallet', balance })),
      },
      walletTransaction: { create: jest.fn().mockResolvedValue({ id: 'txn' }) },
    };
    db.$transaction = (work: any) => work(db);
    const service = new CustomersService(db);
    const dto = { type: 'DEBIT', amount: 80, description: 'Fixture debit' } as const;
    const results = await Promise.allSettled([
      service.adjustWallet('c', dto, { sub: 'admin', name: 'Admin' } as any),
      service.adjustWallet('c', dto, { sub: 'admin', name: 'Admin' } as any),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.find((r) => r.status === 'rejected')).toMatchObject({
      reason: expect.any(BadRequestException),
    });
    expect(balance).toBe(20);
    expect(db.walletTransaction.create).toHaveBeenCalledTimes(1);
    expect(db.walletTransaction.create.mock.calls[0][0].data.balanceAfter).toBe(20);
  });
});
