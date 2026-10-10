import { EmployeeStatus, InviteStatus, Prisma, PrismaClient, StaffRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { z } from 'zod';

const inputSchema = z.object({
  ADMIN_LOGIN_EMAIL: z.string().trim().toLowerCase().email().default('admin@cobuddy.com'),
  ADMIN_LOGIN_PASSWORD: z
    .string()
    .min(14)
    .max(64)
    .refine((password) => Buffer.byteLength(password, 'utf8') <= 72),
});

class AdminPasswordResetError extends Error {}

export async function resetAdminPassword(
  prisma: PrismaClient,
  environment: Record<string, string | undefined>,
) {
  const input = inputSchema.safeParse(environment);
  if (!input.success) {
    throw new AdminPasswordResetError(
      'Set a valid ADMIN_LOGIN_EMAIL and ADMIN_LOGIN_PASSWORD (14-64 characters, at most 72 UTF-8 bytes).',
    );
  }

  const passwordHash = await bcrypt.hash(input.data.ADMIN_LOGIN_PASSWORD, 12);
  await prisma.$transaction(
    async (tx) => {
      const admin = await tx.staffEmployee.findUnique({
        where: { email: input.data.ADMIN_LOGIN_EMAIL },
        select: { id: true, roles: true, status: true, inviteStatus: true },
      });
      if (
        !admin ||
        !admin.roles.includes(StaffRole.SUPER_ADMIN) ||
        admin.status !== EmployeeStatus.ACTIVE ||
        admin.inviteStatus !== InviteStatus.ACCEPTED
      ) {
        throw new AdminPasswordResetError('An active, accepted super admin account is required.');
      }

      await tx.staffEmployee.update({ where: { id: admin.id }, data: { passwordHash } });
      await tx.staffSession.deleteMany({ where: { employeeId: admin.id } });
      await tx.passwordResetToken.deleteMany({ where: { employeeId: admin.id } });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

async function main() {
  const prisma = new PrismaClient();
  try {
    await resetAdminPassword(prisma, process.env);
    console.log('Admin password updated. Existing sessions and password reset links revoked.');
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module)
  void main().catch((error: unknown) => {
    console.error(
      error instanceof AdminPasswordResetError
        ? error.message
        : 'Admin password reset failed. Check database access and retry.',
    );
    process.exitCode = 1;
  });
