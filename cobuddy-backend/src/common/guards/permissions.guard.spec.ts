import 'reflect-metadata';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StaffRole } from '@prisma/client';
import { IS_PUBLIC_KEY, IS_ALLOWED_FOR, ROLES_KEY } from '../decorators/auth.decorators';
import { PermissionsGuard, MODULE_PERMISSIONS } from './permissions.guard';
import { RolesGuard } from './roles.guard';
import { applyCityScope } from './city-scope.guard';

function context(
  moduleKey: string,
  roles: StaffRole[],
  explicitRoles?: StaffRole[],
  isPublic = false,
) {
  class Controller {}
  const handler = () => undefined;
  Reflect.defineMetadata(IS_ALLOWED_FOR, { moduleKey }, Controller);
  if (explicitRoles) Reflect.defineMetadata(ROLES_KEY, explicitRoles, handler);
  if (isPublic) Reflect.defineMetadata(IS_PUBLIC_KEY, true, handler);
  return {
    getClass: () => Controller,
    getHandler: () => handler,
    switchToHttp: () => ({ getRequest: () => ({ user: isPublic ? undefined : { roles } }) }),
  } as unknown as ExecutionContext;
}

describe('Admin authorization policy', () => {
  const permissions = new PermissionsGuard(new Reflector());
  const roles = new RolesGuard(new Reflector());

  it('allows a public invite endpoint despite class-level employee permissions', () => {
    const request = context('system.employees', [], undefined, true);
    expect(permissions.canActivate(request)).toBe(true);
    expect(roles.canActivate(request)).toBe(true);
  });

  it.each(
    Object.entries(MODULE_PERMISSIONS).flatMap(([key, allowed]) =>
      allowed.map((role) => [key, role] as const),
    ),
  )('uses the same policy in both guards for %s / %s', (key, role) => {
    const request = context(key, [role]);
    expect(permissions.canActivate(request)).toBe(true);
    expect(roles.canActivate(request)).toBe(true);
  });

  it('lets the finance role use a specifically authorized wallet action', () => {
    expect(
      permissions.canActivate(
        context('customers.list', [StaffRole.FINANCE_ADMIN], [StaffRole.FINANCE_ADMIN]),
      ),
    ).toBe(true);
  });

  it('does not let customer support inherit a finance-only mutation', () => {
    expect(() =>
      permissions.canActivate(
        context('customers.list', [StaffRole.SUPPORT_AGENT], [StaffRole.FINANCE_ADMIN]),
      ),
    ).toThrow(ForbiddenException);
  });

  it('denies unknown module keys and unauthorized roles', () => {
    expect(() => permissions.canActivate(context('missing-module', [StaffRole.MODERATOR]))).toThrow(
      ForbiddenException,
    );
    expect(() =>
      permissions.canActivate(context('system.employees', [StaffRole.SUPPORT_AGENT])),
    ).toThrow(ForbiddenException);
  });

  it('intersects the requested city with allowed cities', () => {
    expect(
      applyCityScope(
        { cityId: 'outside-city', status: 'ACTIVE' },
        { cityScopeFilter: ['allowed-city'] },
      ),
    ).toEqual({
      AND: [{ cityId: 'outside-city', status: 'ACTIVE' }, { cityId: { in: ['allowed-city'] } }],
    });
  });
});
