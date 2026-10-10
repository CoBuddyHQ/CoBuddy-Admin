import { Reflector } from '@nestjs/core';
import { NotFoundException } from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { CityScopeGuard, applyCityScope } from './city-scope.guard';
import { PermissionsGuard } from './permissions.guard';
import { CompanionsController } from '@/modules/companions/companions.controller';
import { CustomersController } from '@/modules/customers/customers.controller';

describe('Directory record access', () => {
  function setup(
    controller: any,
    method: string,
    roles: StaffRole[] = [StaffRole.SUPPORT_AGENT],
    cityScopeIds = ['city-a'],
  ) {
    const req = { user: { roles, cityScopeIds }, params: { id: 'record-b' } };
    const ctx = {
      getHandler: () => controller.prototype[method],
      getClass: () => controller,
      switchToHttp: () => ({ getRequest: () => req }),
    } as any;
    const db = {
      customer: { findFirst: jest.fn().mockResolvedValue(null) },
      companion: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    return { req, ctx, db, guard: new CityScopeGuard(new Reflector(), db as any) };
  }

  it.each([
    'findOne',
    'updateStatus',
    'getBookingHistory',
    'getTransactions',
    'getReports',
    'adjustWallet',
    'getTickets',
  ])('denies out-of-city customer %s before invocation', async (method) => {
    const { guard, ctx, db } = setup(CustomersController, method);
    await expect(guard.canActivate(ctx)).rejects.toThrow(NotFoundException);
    expect(db.customer.findFirst).toHaveBeenCalledWith({
      where: { id: 'record-b', cityId: { in: ['city-a'] } },
      select: { id: true },
    });
  });

  it.each([
    'findOne',
    'updateStatus',
    'updateVerificationStatus',
    'getTrustScoreHistory',
    'getSessionHistory',
    'getPayouts',
    'getBankAccounts',
    'approveBankAccount',
  ])('denies out-of-city companion %s', async (method) => {
    const { guard, ctx } = setup(CompanionsController, method);
    await expect(guard.canActivate(ctx)).rejects.toThrow(NotFoundException);
  });

  it('allows in-scope records and super admin access', async () => {
    const a = setup(CustomersController, 'findOne');
    a.db.customer.findFirst.mockResolvedValue({ id: 'record-b' } as never);
    await expect(a.guard.canActivate(a.ctx)).resolves.toBe(true);
    const b = setup(CustomersController, 'findOne', [StaffRole.SUPER_ADMIN]);
    await expect(b.guard.canActivate(b.ctx)).resolves.toBe(true);
    expect(b.db.customer.findFirst).not.toHaveBeenCalled();
  });

  it('does not make an unassigned city manager global', async () => {
    const { guard, ctx, req } = setup(
      CustomersController,
      'findAll',
      [StaffRole.CITY_OPS_MANAGER],
      [],
    );
    req.params = {} as any;
    await guard.canActivate(ctx);
    expect(applyCityScope({}, req)).toEqual({ AND: [{}, { cityId: { in: [] } }] });
  });

  it.each(['approveBankAccount', 'updateVerificationStatus', 'updateTrustScore', 'updateStatus'])(
    'rejects support-agent sensitive companion action %s',
    (method) => {
      const { ctx } = setup(CompanionsController, method);
      expect(() => new PermissionsGuard(new Reflector()).canActivate(ctx)).toThrow();
    },
  );

  it('permits finance bank approval but not KYC decisions', () => {
    const permissions = new PermissionsGuard(new Reflector());
    expect(
      permissions.canActivate(
        setup(CompanionsController, 'approveBankAccount', [StaffRole.FINANCE_ADMIN]).ctx,
      ),
    ).toBe(true);
    expect(() =>
      permissions.canActivate(
        setup(CompanionsController, 'updateVerificationStatus', [StaffRole.FINANCE_ADMIN]).ctx,
      ),
    ).toThrow();
  });
});
