import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Read-only candidates from the removed seed. These identifiers alone do not prove provenance.
  const counts = {
    staffCandidates: await prisma.staffEmployee.count({
      where: { id: { in: Array.from({ length: 9 }, (_, i) => `emp-${i + 1}`) } },
    }),
    customerCandidates: await prisma.customer.count({
      where: { name: 'Test Customer', email: 'testcustomer@example.com' },
    }),
    companionCandidates: await prisma.companion.count({
      where: { name: 'Test Companion', email: 'testcompanion@example.com' },
    }),
    bookingCandidates: await prisma.booking.count({
      where: {
        id: { in: ['BOOK-1', 'BOOK-2', 'BOOK-3', 'BOOK-4'] },
        bookingRef: { in: ['CB-2026-001', 'CB-2026-002', 'CB-2026-003', 'CB-2026-004'] },
      },
    }),
    venueCandidates: await prisma.venue.count({ where: { id: 'VENUE-1', name: 'Sample Cafe' } }),
    applicationCandidates: await prisma.companionApplication.count({
      where: { id: { in: ['APP-1', 'APP-2'] } },
    }),
    verificationCandidates: await prisma.verificationCase.count({
      where: { caseRef: { in: ['VC-2026-001', 'VC-2026-002', 'VC-2026-003'] } },
    }),
    reportCandidates: await prisma.userReport.count({
      where: { id: { in: ['REPORT-1', 'REPORT-2'] } },
    }),
    banCandidates: await prisma.userBan.count({ where: { id: 'BAN-1' } }),
    reviewCandidates: await prisma.review.count({
      where: { id: { in: ['REVIEW-1', 'REVIEW-2'] } },
    }),
  };
  console.log(
    JSON.stringify(
      {
        mode: 'READ_ONLY',
        counts,
        warning:
          'Review provenance and linked records before removal. Keep the active administrator and real activity. No records were changed.',
      },
      null,
      2,
    ),
  );
}

main()
  .catch(() => {
    console.error('Inventory failed. Check database connectivity.');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
