import { bootstrapAdmin } from '../../prisma/bootstrap-admin';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Initial administrator provisioning', () => {
  const input = {
    ADMIN_BOOTSTRAP_EMAIL: '  Admin@Example.test ',
    ADMIN_BOOTSTRAP_NAME: 'Admin',
    ADMIN_BOOTSTRAP_PASSWORD: 'Test-only-password-123',
  };
  function setup() {
    const tx = {
      $executeRaw: jest.fn(async () => 1),
      staffEmployee: {
        count: jest.fn(async () => 0),
        findUnique: jest.fn(async (): Promise<unknown> => null),
        create: jest.fn(async () => ({})),
      },
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) =>
        callback(tx),
      ),
    };
    return { tx, prisma };
  }

  it('creates only the initial admin and hashes the supplied password', async () => {
    const { tx, prisma } = setup();
    await bootstrapAdmin(prisma as any, input);
    const call = tx.staffEmployee.create.mock.calls[0] as unknown as [
      { data: { email: string; passwordHash: string; roles: string[] } },
    ];
    expect(call[0].data.email).toBe('admin@example.test');
    expect(call[0].data.roles).toEqual(['SUPER_ADMIN']);
    expect(await bcrypt.compare(input.ADMIN_BOOTSTRAP_PASSWORD, call[0].data.passwordHash)).toBe(
      true,
    );
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(tx.$executeRaw).toHaveBeenCalled();
  });

  it('refuses a second administrator or an existing staff email', async () => {
    const { tx, prisma } = setup();
    tx.staffEmployee.count.mockResolvedValueOnce(1);
    await expect(bootstrapAdmin(prisma as any, input)).rejects.toThrow('already exists');
    tx.staffEmployee.findUnique.mockResolvedValueOnce({ id: 'existing-staff' });
    await expect(bootstrapAdmin(prisma as any, input)).rejects.toThrow('email already exists');
    expect(tx.staffEmployee.create).not.toHaveBeenCalled();
  });

  it('rejects incomplete credentials before accessing the database', async () => {
    const { prisma } = setup();
    await expect(
      bootstrapAdmin(prisma as any, { ...input, ADMIN_BOOTSTRAP_PASSWORD: 'short' }),
    ).rejects.toThrow('14-64');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
