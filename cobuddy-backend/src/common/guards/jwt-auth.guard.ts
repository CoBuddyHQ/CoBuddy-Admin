import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmployeeStatus, InviteStatus } from '@prisma/client';
import { IS_PUBLIC_KEY } from '@/common/decorators/auth.decorators';
import { PrismaService } from '@/prisma/prisma.module';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [ctx.getHandler(), ctx.getClass()])
    )
      return true;
    const req = ctx.switchToHttp().getRequest();
    const auth = req.headers['authorization'];
    const bearer = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!bearer) {
      if (!['production', 'staging'].includes(this.config.get<string>('NODE_ENV') || '')) {
        this.logger.warn(
          JSON.stringify({
            event: 'auth_missing_bearer',
            requestId: req.id,
            method: req.method,
            route: req.route?.path ?? 'unmatched',
          }),
        );
      }
      throw new UnauthorizedException('Missing bearer token');
    }

    let payload: { sub?: string; sid?: string };
    try {
      payload = this.jwtService.verify(bearer, {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    if (!payload || typeof payload.sub !== 'string' || typeof payload.sid !== 'string') {
      throw new UnauthorizedException('Invalid session token; please sign in again');
    }

    const session = await this.prisma.staffSession.findFirst({
      where: { id: payload.sid, employeeId: payload.sub, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            email: true,
            roles: true,
            cityScopeIds: true,
            department: true,
            status: true,
            inviteStatus: true,
          },
        },
      },
    });
    if (!session) throw new UnauthorizedException('Session revoked');
    const employee = session.employee;
    if (
      employee.status !== EmployeeStatus.ACTIVE ||
      employee.inviteStatus !== InviteStatus.ACCEPTED
    ) {
      throw new UnauthorizedException('Account inactive');
    }
    req.user = {
      sub: employee.id,
      sessionId: session.id,
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      roles: employee.roles,
      cityScopeIds: employee.cityScopeIds || [],
      department: employee.department,
    };
    return true;
  }
}
