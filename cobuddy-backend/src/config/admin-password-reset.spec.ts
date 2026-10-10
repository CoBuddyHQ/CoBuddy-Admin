import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { resetAdminPassword } from '../../prisma/set-admin-password';

describe('Administrator password recovery', () => {
  const input = {
    ADMIN_LOGIN_EMAIL: '  Admin@Example.test ',
    ADMIN_LOGIN_PASSWORD: 'Test-only-password-123',
  };

  function setup() {
    const admin = {
      id: 'admin-1',
      roles: ['SUPER_ADMIN'],
      status: 'ACTIVE',
      inviteStatus: 'ACCEPTED',
    };
    const tx = {
      staffEmployee: {
        findUnique: jest.fn(async (): Promise<typeof admin | null> => admin),
        update: jest.fn(async (_args: { data: { passwordHash: string } }) => ({})),
      },
      staffSession: { deleteMany: jest.fn(async () => ({ count: 1 })) },
      passwordResetToken: { deleteMany: jest.fn(async () => ({ count: 1 })) },
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) =>
        callback(tx),
      ),
    };
    return { admin, tx, prisma, client: prisma as unknown as PrismaClient };
  }

  it('hashes the new password and revokes sessions and recovery links together', async () => {
    const { tx, prisma, client } = setup();
    await resetAdminPassword(client, input);
    expect(tx.staffEmployee.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'admin@example.test' } }),
    );
    const update = tx.staffEmployee.update.mock.calls[0][0];
    expect(await bcrypt.compare(input.ADMIN_LOGIN_PASSWORD, update.data.passwordHash)).toBe(true);
    expect(update).toEqual({
      where: { id: 'admin-1' },
      data: { passwordHash: expect.any(String) },
    });
    expect(tx.staffSession.deleteMany).toHaveBeenCalledWith({ where: { employeeId: 'admin-1' } });
    expect(tx.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { employeeId: 'admin-1' },
    });
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  });

  it.each([
    { ADMIN_LOGIN_PASSWORD: '' },
    { ADMIN_LOGIN_PASSWORD: 'too-short' },
    { ADMIN_LOGIN_PASSWORD: 'a'.repeat(65) },
    { ADMIN_LOGIN_PASSWORD: '\u00e9'.repeat(40) },
    { ADMIN_LOGIN_EMAIL: 'invalid-email' },
  ])('rejects invalid credentials before database access: %j', async (invalid) => {
    const { prisma, client } = setup();
    await expect(resetAdminPassword(client, { ...input, ...invalid })).rejects.toThrow('14-64');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it.each(['missing', 'suspended', 'pending', 'non-admin'])(
    'does not change a %s account',
    async (state) => {
      const { admin, tx, client } = setup();
      tx.staffEmployee.findUnique.mockResolvedValueOnce(
        state === 'missing'
          ? null
          : {
              ...admin,
              status: state === 'suspended' ? 'SUSPENDED' : admin.status,
              inviteStatus: state === 'pending' ? 'PENDING' : admin.inviteStatus,
              roles: state === 'non-admin' ? ['SUPPORT_LEAD'] : admin.roles,
            },
      );
      await expect(resetAdminPassword(client, input)).rejects.toThrow('active, accepted');
      expect(tx.staffEmployee.update).not.toHaveBeenCalled();
      expect(tx.staffSession.deleteMany).not.toHaveBeenCalled();
    },
  );

  it('propagates revocation failures so the database transaction rolls back', async () => {
    const { tx, client } = setup();
    tx.staffSession.deleteMany.mockRejectedValueOnce(new Error('revocation failed'));
    await expect(resetAdminPassword(client, input)).rejects.toThrow('revocation failed');
    expect(tx.passwordResetToken.deleteMany).not.toHaveBeenCalled();
  });
});
