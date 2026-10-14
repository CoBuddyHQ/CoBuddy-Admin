import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('reference seed', () => {
  it('never creates demo identities or business activity', () => {
    const source = readFileSync(path.resolve(__dirname, '../../prisma/seed.ts'), 'utf8');
    expect(source).not.toMatch(
      /prisma\.(staffEmployee|customer|companion|booking|wallet|refund|verificationCase|venue)\./,
    );
    expect(source).not.toMatch(/SEED_DEMO_PASSWORD|passwordHash/);
  });
});
