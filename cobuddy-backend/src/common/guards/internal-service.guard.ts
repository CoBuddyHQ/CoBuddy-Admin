import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class InternalServiceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expectedSecret = process.env.INTERNAL_SERVICE_SECRET;
    if (!expectedSecret) {
      throw new ServiceUnavailableException('Internal service authentication is not configured.');
    }

    const request = context.switchToHttp().getRequest();
    const providedSecret =
      request.headers['x-internal-service-key'] ?? request.headers['x-internal-token'];
    if (typeof providedSecret !== 'string') {
      throw new UnauthorizedException('Invalid internal service credentials.');
    }

    const expected = Buffer.from(expectedSecret, 'utf8');
    const provided = Buffer.from(providedSecret, 'utf8');
    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
      throw new UnauthorizedException('Invalid internal service credentials.');
    }
    return true;
  }
}
