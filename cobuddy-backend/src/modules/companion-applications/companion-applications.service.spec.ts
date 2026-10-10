import * as bcrypt from 'bcrypt';
import { CompanionApplicationsService } from './companion-applications.service';

jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('fixture-bcrypt-hash') }));

describe('Companion application approval', () => {
  it('stores only a bcrypt credential and returns public companion fields', async () => {
    const application = {
      id: 'application',
      firstName: 'Test',
      lastName: 'Companion',
      email: 'companion@example.test',
      phone: '9999999999',
      cityId: 'city',
      companionId: null,
    };
    const db: any = {
      companionApplication: {
        findUnique: jest.fn().mockResolvedValue(application),
        update: jest.fn().mockResolvedValue({ ...application, applicationStatus: 'APPROVED' }),
      },
      companion: { create: jest.fn().mockResolvedValue({ id: 'companion' }) },
      wallet: { create: jest.fn().mockResolvedValue({ id: 'wallet' }) },
    };
    db.$transaction = (work: any) => work(db);

    const result = await new CompanionApplicationsService(db).approve('application', {
      sub: 'admin',
    } as any);

    expect(bcrypt.hash).toHaveBeenCalledWith(expect.any(String), 12);
    const create = db.companion.create.mock.calls[0][0];
    expect(create.data.passwordHash).toBe('fixture-bcrypt-hash');
    expect(create.select.passwordHash).toBeUndefined();
    expect(result.data.companion).not.toHaveProperty('passwordHash');
  });
});
