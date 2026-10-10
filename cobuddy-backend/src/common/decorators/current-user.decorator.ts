import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthStaffPayload {
  sub: string;
  sessionId?: string;
  employeeId: string;
  name: string;
  email: string;
  roles: string[];
  cityScopeIds: string[];
  department?: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthStaffPayload => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as AuthStaffPayload;
  },
);
