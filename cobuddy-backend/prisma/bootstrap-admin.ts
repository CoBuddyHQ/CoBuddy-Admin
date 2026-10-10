import { randomUUID } from 'crypto';
import { PrismaClient, StaffRole, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { z } from 'zod';

const inputSchema = z.object({
  ADMIN_BOOTSTRAP_EMAIL: z.string().trim().toLowerCase().email(),
  ADMIN_BOOTSTRAP_NAME: z.string().trim().min(1).max(120),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(14).max(64),
});

class BootstrapError extends Error {}

export async function bootstrapAdmin(
  prisma: PrismaClient,
  environment: Record<string, string | undefined>,
) {
  const input = inputSchema.safeParse(environment);
  if (!input.success) {
    throw new BootstrapError(
      'Set ADMIN_BOOTSTRAP_EMAIL, ADMIN_BOOTSTRAP_NAME and ADMIN_BOOTSTRAP_PASSWORD (14-64 characters).',
    );
  }
  const passwordHash = await bcrypt.hash(input.data.ADMIN_BOOTSTRAP_PASSWORD, 12);
  await prisma.$transaction(
    async (tx) => {
      // Serialize bootstrap runs so two deployments cannot create initial admins.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(735193820)`;
      if (await tx.staffEmployee.count({ where: { roles: { has: StaffRole.SUPER_ADMIN } } })) {
        throw new BootstrapError(
          'A super admin already exists. Use the staff invitation or password recovery flow.',
        );
      }
      if (
        await tx.staffEmployee.findUnique({ where: { email: input.data.ADMIN_BOOTSTRAP_EMAIL } })
      ) {
        throw new BootstrapError(
          'That staff email already exists. Bootstrap does not modify existing accounts.',
        );
      }
      await tx.staffEmployee.create({
        data: {
          employeeId: 'ADMIN-' + randomUUID(),
          name: input.data.ADMIN_BOOTSTRAP_NAME,
          email: input.data.ADMIN_BOOTSTRAP_EMAIL,
          passwordHash,
          designation: 'Administrator',
          department: 'ENGINEERING',
          roles: [StaffRole.SUPER_ADMIN],
          status: 'ACTIVE',
          inviteStatus: 'ACCEPTED',
          cityScopeIds: [],
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

async function main() {
  const prisma = new PrismaClient();
  try {
    await bootstrapAdmin(prisma, process.env);
    console.log('Initial administrator created. Sign in and enable two-factor authentication.');
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module)
  void main().catch((error: unknown) => {
    // Database errors may contain connection or row data; keep them out of logs.
    console.error(
      error instanceof BootstrapError
        ? error.message
        : 'Admin bootstrap failed. Check database access and migration status.',
    );
    process.exitCode = 1;
  });
