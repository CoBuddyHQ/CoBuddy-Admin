import 'reflect-metadata';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JWT session authorization', () => {
  const employee = {
    id: 'employee-1',
    employeeId: 'EMP-001',
    name: 'Operator',
    email: 'operator@example.test',
    roles: ['SUPPORT_AGENT'],
    cityScopeIds: ['city-current'],
    department: 'SUPPORT',
    status: 'ACTIVE',
    inviteStatus: 'ACCEPTED',
  };
  let db: any;
  let jwt: any;
  let request: any;
  let context: ExecutionContext;
  let guard: JwtAuthGuard;

  beforeEach(() => {
    db = {
      staffSession: { findFirst: jest.fn().mockResolvedValue({ id: 'session-current', employee }) },
    };
    jwt = {
      verify: jest.fn().mockReturnValue({
        sub: employee.id,
        sid: 'session-current',
        roles: ['SUPER_ADMIN'],
        cityScopeIds: ['old-city'],
      }),
    };
    request = { headers: { authorization: 'Bearer signed-token' } };
    context = {
      getClass: () => class Controller {},
      getHandler: () => () => undefined,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    guard = new JwtAuthGuard(new Reflector(), jwt, { getOrThrow: () => 'secret' } as any, db);
  });

  it('authorizes using fresh database roles and scopes', async () => {
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user.roles).toEqual(['SUPPORT_AGENT']);
    expect(request.user.cityScopeIds).toEqual(['city-current']);
    expect(request.user.sessionId).toBe('session-current');
    expect(db.staffSession.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'session-current', employeeId: employee.id }),
      }),
    );
  });

  it('rejects a revoked session even if the employee has another session', async () => {
    db.staffSession.findFirst.mockImplementation(({ where }: any) =>
      Promise.resolve(
        where.id === 'other-active-session' ? { id: 'other-active-session', employee } : null,
      ),
    );
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a token without an exact session id', async () => {
    jwt.verify.mockReturnValue({ sub: employee.id });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(db.staffSession.findFirst).not.toHaveBeenCalled();
  });

  it('rejects a suspended account with a still-present session', async () => {
    db.staffSession.findFirst.mockResolvedValue({
      id: 'session-current',
      employee: { ...employee, status: 'SUSPENDED' },
    });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('does not hide a database outage as an invalid token', async () => {
    db.staffSession.findFirst.mockRejectedValue(new Error('Database unavailable'));
    await expect(guard.canActivate(context)).rejects.toThrow('Database unavailable');
  });
});
