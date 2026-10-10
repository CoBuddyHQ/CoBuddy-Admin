import { AuthService } from './auth.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('Authentication sessions and MFA', () => {
  const employee = {
    id: 'employee-1',
    employeeId: 'EMP-001',
    name: 'Admin',
    email: 'admin@example.test',
    roles: ['SUPER_ADMIN'],
    cityScopeIds: [],
    department: 'ADMIN',
    designation: 'Admin',
    status: 'ACTIVE',
    inviteStatus: 'ACCEPTED',
    twoFactorEnabled: false,
  };
  let db: any;
  let jwt: any;
  let service: AuthService;

  beforeEach(() => {
    db = {
      staffEmployee: {
        findUnique: jest.fn().mockResolvedValue(employee),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      staffSession: {
        create: jest.fn(),
        deleteMany: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({
          id: 'session-1',
          employeeId: employee.id,
          expiresAt: new Date(Date.now() + 60000),
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    jwt = { sign: jest.fn().mockReturnValue('signed-token'), verify: jest.fn() };
    const config = { get: () => undefined, getOrThrow: () => 'secret' };
    service = new AuthService(db, jwt, config as any);
  });

  it('binds a login access token to the created database session', async () => {
    await service.finalizeLogin(employee);
    const sessionId = db.staffSession.create.mock.calls[0][0].data.id;
    expect(sessionId).toBeTruthy();
    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ sid: sessionId, sub: employee.id }),
    );
  });

  it('keeps the same session binding on refresh', async () => {
    await service.refresh('old-refresh');
    expect(jwt.sign).toHaveBeenCalledWith(expect.objectContaining({ sid: 'session-1' }));
    expect(db.staffSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'session-1', refreshToken: 'old-refresh' }),
      }),
    );
  });

  it('rejects a refresh token consumed concurrently instead of returning a server error', async () => {
    db.staffSession.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.refresh('old-refresh')).rejects.toThrow(UnauthorizedException);
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it('revokes the authenticated session when logout omits a refresh token', async () => {
    await service.logout({ sub: employee.id, sessionId: 'session-1' } as any);
    expect(db.staffSession.deleteMany).toHaveBeenCalledWith({
      where: { id: 'session-1', employeeId: employee.id },
    });
  });

  it('does not allow setup to silently disable an existing second factor', async () => {
    db.staffEmployee.findUnique.mockResolvedValue({ ...employee, twoFactorEnabled: true });
    await expect(service.setup2FA({ sub: employee.id } as any)).rejects.toThrow(
      BadRequestException,
    );
    expect(db.staffEmployee.updateMany).not.toHaveBeenCalled();
  });

  it('rejects an MFA challenge if the account was suspended after password verification', async () => {
    jwt.verify.mockReturnValue({ sub: employee.id, stage: 'mfa-required' });
    db.staffEmployee.findUnique.mockResolvedValue({
      ...employee,
      status: 'SUSPENDED',
      twoFactorEnabled: true,
      twoFactorSecret: 'secret',
    });
    await expect(service.verify2FA('challenge', '123456')).rejects.toThrow(UnauthorizedException);
    expect(db.staffSession.create).not.toHaveBeenCalled();
  });
});
