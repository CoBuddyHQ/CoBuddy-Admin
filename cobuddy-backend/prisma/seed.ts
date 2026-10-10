import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Only essential reference data. Never create identities, balances or business activity.
  await prisma.appLanguage.upsert({
    where: { code: 'en' },
    update: {},
    create: { code: 'en', name: 'English', active: true },
  });
  console.log('Reference data initialized. Existing records and credentials were not changed.');
  console.log('Create the first administrator separately using npm run admin:bootstrap.');
}

main()
  .catch(() => {
    console.error('Reference initialization failed. Check database connectivity and migrations.');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
