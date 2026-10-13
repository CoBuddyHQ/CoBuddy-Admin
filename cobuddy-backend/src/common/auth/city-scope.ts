import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { ForbiddenException } from '@nestjs/common';

export function scopedCities(user: AuthStaffPayload): string[] | undefined {
  // An empty scope is unrestricted except for city managers, who must fail closed.
  if (user.roles.includes('SUPER_ADMIN')) return undefined;
  if (user.cityScopeIds.length || user.roles.includes('CITY_OPS_MANAGER')) return user.cityScopeIds;
  return undefined;
}

export function cityWhere(user: AuthStaffPayload) {
  const cities = scopedCities(user);
  return cities ? { cityId: { in: cities } } : {};
}

export function requireCity(user: AuthStaffPayload, cityId: string) {
  const cities = scopedCities(user);
  if (cities && !cities.includes(cityId))
    throw new ForbiddenException('City is outside your assigned scope');
}

export function requireGlobal(user: AuthStaffPayload) {
  if (scopedCities(user))
    throw new ForbiddenException('Global configuration requires an unrestricted administrator');
}
