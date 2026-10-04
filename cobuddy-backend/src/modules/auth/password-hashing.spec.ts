import { compare, getRounds, hash } from 'bcrypt';

describe('Password hash compatibility', () => {
  const password = 'LegacyCompatibilityTest!42';
  // Generated with bcrypt 5.1.1 solely for this compatibility fixture.
  const legacyHash = '$2b$10$zLn2cr/1xLoL68LiWdTP4OMpdD2ahALs5fxvJgwXiRvJ4q8iU0oim';

  it('accepts an existing bcrypt 5 password hash after upgrading the native binding', async () => {
    await expect(compare(password, legacyHash)).resolves.toBe(true);
  });

  it('rejects a wrong password against the legacy hash', async () => {
    await expect(compare('WrongPassword!42', legacyHash)).resolves.toBe(false);
  });

  it('creates verifiable hashes with the requested cost', async () => {
    const passwordHash = await hash(password, 10);
    expect(getRounds(passwordHash)).toBe(10);
    await expect(compare(password, passwordHash)).resolves.toBe(true);
    await expect(compare('WrongPassword!42', passwordHash)).resolves.toBe(false);
  });
});
