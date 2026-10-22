import {
  ExecutionContext,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InternalServiceGuard } from './internal-service.guard';

describe('InternalServiceGuard', () => {
  const originalSecret = process.env.INTERNAL_SERVICE_SECRET;
  const guard = new InternalServiceGuard();

  const contextWithHeaders = (headers: Record<string, string>) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ headers }) }),
    }) as unknown as ExecutionContext;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.INTERNAL_SERVICE_SECRET;
    else process.env.INTERNAL_SERVICE_SECRET = originalSecret;
  });

  it('fails closed when no shared secret is configured', () => {
    delete process.env.INTERNAL_SERVICE_SECRET;
    expect(() => guard.canActivate(contextWithHeaders({}))).toThrow(ServiceUnavailableException);
  });

  it('rejects missing or incorrect credentials', () => {
    process.env.INTERNAL_SERVICE_SECRET = 'internal-secret-for-this-test';
    expect(() => guard.canActivate(contextWithHeaders({}))).toThrow(UnauthorizedException);
    expect(() =>
      guard.canActivate(contextWithHeaders({ 'x-internal-service-key': 'wrong-test-secret' })),
    ).toThrow(UnauthorizedException);
  });

  it('accepts the configured service key using a constant-time comparison', () => {
    process.env.INTERNAL_SERVICE_SECRET = 'internal-secret-for-this-test';
    expect(
      guard.canActivate(
        contextWithHeaders({ 'x-internal-service-key': 'internal-secret-for-this-test' }),
      ),
    ).toBe(true);
  });
});
