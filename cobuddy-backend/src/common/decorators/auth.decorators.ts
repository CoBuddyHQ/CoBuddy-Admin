import { SetMetadata } from '@nestjs/common';
import { StaffRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: StaffRole[]) => SetMetadata(ROLES_KEY, roles);

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const IS_ALLOWED_FOR = 'isAllowedFor';
export interface AllowedFor {
  moduleKey: string;
}
export const AllowModule = (moduleKey: string) => SetMetadata(IS_ALLOWED_FOR, { moduleKey });

export const CITY_SCOPE_KEY = 'cityScope';
export interface CityScopeMetadata {
  field: string;
  resource?: 'customer' | 'companion';
}
export const CityScoped = (field = 'cityId', resource?: CityScopeMetadata['resource']) =>
  SetMetadata(CITY_SCOPE_KEY, { field, resource });

export { CurrentUser } from './current-user.decorator';
export type { AuthStaffPayload } from './current-user.decorator';
