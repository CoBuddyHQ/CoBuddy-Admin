import { Injectable, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  CITY_SCOPE_KEY,
  IS_PUBLIC_KEY,
  CityScopeMetadata,
} from '@/common/decorators/auth.decorators';
import { PrismaService } from '@/prisma/prisma.module';

@Injectable()
export class CityScopeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const meta = this.reflector.getAllAndOverride<CityScopeMetadata | undefined>(CITY_SCOPE_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    const req = ctx.switchToHttp().getRequest();
    const user = req.user;

    if (!user) return false;
    if (user.roles?.includes('SUPER_ADMIN')) return true;
    const cities: string[] = user.cityScopeIds || [];
    if (cities.length === 0 && !user.roles?.includes('CITY_OPS_MANAGER')) return true;

    req.cityScopeFilter = cities;
    req.cityScopeField = meta?.field || 'cityId';
    if (meta?.resource && req.params?.id) {
      const query = { where: { id: req.params.id, cityId: { in: cities } }, select: { id: true } };
      const record =
        meta.resource === 'customer'
          ? await this.prisma.customer.findFirst(query)
          : await this.prisma.companion.findFirst(query);
      if (!record) throw new NotFoundException('Record not found');
    }
    return true;
  }
}

export function applyCityScope(prismaWhere: any, req: any): any {
  if (!req?.cityScopeFilter) return prismaWhere;
  const field = req.cityScopeField || 'cityId';
  const scoped = req.cityScopeFilter as string[];
  return { AND: [prismaWhere, { [field]: { in: scoped } }] };
}
