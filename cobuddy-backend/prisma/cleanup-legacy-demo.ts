import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const db = new PrismaClient();
const apply = process.argv.includes('--apply');
const backupArg = process.argv.indexOf('--backup');
const backup = backupArg >= 0 ? path.resolve(process.argv[backupArg + 1] || '') : undefined;
type Plan = Record<string, string[]>;

async function planCleanup(tx: Prisma.TransactionClient) {
  const plan: Plan = {};
  const customers = await tx.customer.findMany({
    where: {
      name: 'Test Customer',
      email: 'testcustomer@example.com',
      phone: '+919876543200',
      cityId: 'CITY-1',
    },
  });
  const companions = await tx.companion.findMany({
    where: {
      name: 'Test Companion',
      email: 'testcompanion@example.com',
      phone: '+919876543201',
      cityId: 'CITY-1',
    },
  });
  const apps = await tx.companionApplication.findMany({
    where: {
      OR: [
        {
          id: 'APP-1',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@example.com',
          phone: '+919876543202',
          cityId: 'CITY-1',
        },
        {
          id: 'APP-2',
          firstName: 'Sarah',
          lastName: 'Smith',
          email: 'sarah.smith@example.com',
          phone: '+919876543203',
          cityId: 'CITY-1',
        },
      ],
    },
  });
  for (const app of apps) {
    if (!app.companionId || companions.some((c) => c.id === app.companionId)) continue;
    const derived = await tx.companion.findFirst({
      where: {
        id: app.companionId,
        phone: app.phone,
        email: app.email,
        name: `${app.firstName} ${app.lastName}`,
        cityId: app.cityId,
      },
    });
    if (!derived)
      throw new Error(
        'A seeded application is linked to a different account; manual review required.',
      );
    companions.push(derived);
  }
  plan.customer = customers.map((c) => c.id);
  plan.companion = companions.map((c) => c.id);
  plan.companionApplication = apps.map((a) => a.id);
  plan.venue = (
    await tx.venue.findMany({
      where: {
        id: 'VENUE-1',
        name: 'Sample Cafe',
        cityId: 'CITY-1',
        address: '123 Main Street, Mumbai',
      },
    })
  ).map((r) => r.id);
  plan.booking = (
    await tx.booking.findMany({
      where: {
        OR: [1, 2, 3, 4].map((n) => ({ id: `BOOK-${n}`, bookingRef: `CB-2026-00${n}` })),
        customerId: { in: plan.customer },
        companionId: { in: plan.companion },
        venueId: { in: plan.venue },
      },
    })
  ).map((r) => r.id);
  plan.verificationCase = (
    await tx.verificationCase.findMany({
      where: {
        OR: [1, 2, 3].map((n) => ({ id: `VERIF-${n}`, caseRef: `VC-2026-00${n}` })),
        applicantId: { in: plan.companion },
        applicantType: 'COMPANION',
      },
    })
  ).map((r) => r.id);
  plan.userReport = (
    await tx.userReport.findMany({
      where: {
        OR: [1, 2].map((n) => ({ id: `REPORT-${n}`, reportRef: `REP-2026-00${n}` })),
        reporterId: { in: plan.customer },
        reportedUserId: { in: plan.companion },
        bookingId: { in: plan.booking },
      },
    })
  ).map((r) => r.id);
  plan.review = (
    await tx.review.findMany({
      where: {
        id: { in: ['REVIEW-1', 'REVIEW-2'] },
        byCustomerId: { in: plan.customer },
        toCompanionId: { in: plan.companion },
        bookingId: { in: plan.booking },
      },
    })
  ).map((r) => r.id);
  plan.userBan = (
    await tx.userBan.findMany({
      where: {
        id: 'BAN-1',
        userId: { in: plan.customer },
        userType: 'CUSTOMER',
        reason: 'Multiple policy violations',
      },
    })
  ).map((r) => r.id);
  plan.wallet = (
    await tx.wallet.findMany({
      where: {
        OR: [{ customerId: { in: plan.customer } }, { companionId: { in: plan.companion } }],
        balance: 0,
      },
    })
  ).map((r) => r.id);
  plan.trustScoreHistoryEntry = (
    await tx.trustScoreHistoryEntry.findMany({ where: { companionId: { in: plan.companion } } })
  ).map((r) => r.id);
  plan.sessionAuditLog = (
    await tx.sessionAuditLog.findMany({ where: { bookingId: { in: plan.booking } } })
  ).map((r) => r.id);
  plan.verificationAuditEvent = (
    await tx.verificationAuditEvent.findMany({ where: { caseId: { in: plan.verificationCase } } })
  ).map((r) => r.id);

  const seedStaff = [
    ['emp-2', 'Support Lead', 'supportlead@cobuddy.com'],
    ['emp-3', 'Junior Support', 'juniorsupport@cobuddy.com'],
    ['emp-4', 'Moderator User', 'moderator@cobuddy.com'],
    ['emp-5', 'Safety Operator', 'safety@cobuddy.com'],
    ['emp-6', 'Finance Admin', 'finance@cobuddy.com'],
    ['emp-7', 'Legal Admin', 'legal@cobuddy.com'],
    ['emp-8', 'City Ops Manager', 'cityops@cobuddy.com'],
    ['emp-9', 'HR Admin', 'hr@cobuddy.com'],
  ];
  const activeStaff = await tx.staffSession.findMany({
    where: { expiresAt: { gt: new Date() } },
    select: { employeeId: true },
  });
  const candidates = await tx.staffEmployee.findMany({
    where: {
      OR: seedStaff.map(([id, name, email]) => ({ id, name, email })),
      NOT: { roles: { has: 'SUPER_ADMIN' } },
      id: { notIn: activeStaff.map((s) => s.employeeId) },
    },
  });
  plan.staffEmployee = candidates.map((s) => s.id);

  // Reject unknown linked activity rather than deleting it or leaving dangling identities.
  const people = [...plan.customer, ...plan.companion];
  const links: Record<string, string[]> = {
    customerId: plan.customer,
    byCustomerId: plan.customer,
    companionId: plan.companion,
    toCompanionId: plan.companion,
    applicantId: people,
    userId: people,
    ownerId: people,
    reporterId: people,
    reportedUserId: people,
    targetUserId: people,
    bookingId: plan.booking,
    caseId: plan.verificationCase,
    venueId: plan.venue,
    walletId: plan.wallet,
  };
  for (const model of Prisma.dmmf.datamodel.models) {
    const delegate = model.name[0].toLowerCase() + model.name.slice(1);
    if (delegate === 'auditLog') continue; // Preserve historical administrator audit events.
    const filters = model.fields
      .filter((f) => f.kind === 'scalar' && links[f.name]?.length)
      .map((f) => ({ [f.name]: { in: links[f.name] } }));
    for (const relation of model.fields.filter(
      (f) => f.kind === 'object' && f.type === 'StaffEmployee',
    ))
      for (const field of relation.relationFromFields ?? [])
        if (
          plan.staffEmployee.length &&
          delegate !== 'staffSession' &&
          delegate !== 'passwordResetToken'
        )
          filters.push({ [field]: { in: plan.staffEmployee } });
    if (!filters.length) continue;
    const count = await (tx as any)[delegate].count({
      where: { OR: filters, id: { notIn: plan[delegate] ?? [] } },
    });
    if (count)
      throw new Error(
        `${model.name} contains ${count} linked records outside the confirmed demo set; no deletion performed.`,
      );
  }
  return plan;
}

async function main() {
  if (
    ['production', 'staging'].includes(process.env.NODE_ENV ?? '') ||
    !['localhost', '127.0.0.1', '[::1]'].includes(new URL(process.env.DATABASE_URL ?? '').hostname)
  )
    throw new Error('Cleanup is restricted to a local development database.');
  if (apply) {
    const backupRoot = path.resolve(__dirname, '../../.local-backups') + path.sep;
    if (
      !backup?.startsWith(backupRoot) ||
      readFileSync(backup).subarray(0, 5).toString() !== 'PGDMP'
    )
      throw new Error(
        'Apply requires --backup pointing to a PostgreSQL custom dump in .local-backups.',
      );
  }
  const result = await db.$transaction(
    async (tx) => {
      const plan = await planCleanup(tx);
      const counts = Object.fromEntries(
        Object.entries(plan).map(([table, ids]) => [table, ids.length]),
      );
      if (apply) {
        // Leaf-first deletion, restricted to the validated IDs. Foreign keys remain enabled.
        const order = [
          'verificationAuditEvent',
          'sessionAuditLog',
          'trustScoreHistoryEntry',
          'review',
          'userReport',
          'userBan',
          'verificationCase',
          'companionApplication',
          'wallet',
          'booking',
          'venue',
          'customer',
          'companion',
          'staffEmployee',
        ];
        for (const table of order)
          if (plan[table].length)
            await (tx as any)[table].deleteMany({ where: { id: { in: plan[table] } } });
        for (const config of await tx.emergencyWorkflowConfig.findMany())
          if (config.onCallTeamIds.some((id) => plan.staffEmployee.includes(id)))
            await tx.emergencyWorkflowConfig.update({
              where: { id: config.id },
              data: {
                onCallTeamIds: config.onCallTeamIds.filter(
                  (id) => !plan.staffEmployee.includes(id),
                ),
              },
            });
        await tx.auditLog.create({
          data: {
            adminId: 'maintenance',
            adminName: 'Local maintenance',
            action: 'REMOVE_LEGACY_DEMO_DATA',
            moduleAffected: 'database',
            details: JSON.stringify(counts),
          },
        });
      }
      return {
        mode: apply ? 'APPLIED' : 'DRY_RUN',
        counts,
        retained:
          'Active login sessions, super administrators, reference/configuration data and administrator audit history',
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 },
  );
  const output = path.resolve(__dirname, '../../test-results/mock-cleanup');
  mkdirSync(output, { recursive: true });
  writeFileSync(
    path.join(output, apply ? 'cleanup.json' : 'preview.json'),
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
}
main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
