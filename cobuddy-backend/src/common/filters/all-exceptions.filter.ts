import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ZodError } from 'zod';

export interface ErrorPayload {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  TWO_FACTOR_REQUIRED: 'TWO_FACTOR_REQUIRED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  INTERNAL: 'INTERNAL_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  FINANCIAL_INTEGRITY: 'FINANCIAL_INTEGRITY_ERROR',
} as const;

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();
    const productionLike = ['production', 'staging'].includes(process.env.NODE_ENV || '');

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = ERROR_CODES.INTERNAL;
    let message = 'Internal Server Error';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResp: any = exception.getResponse();

      if (status === HttpStatus.UNAUTHORIZED) code = ERROR_CODES.UNAUTHORIZED;
      else if (status === HttpStatus.FORBIDDEN) code = ERROR_CODES.FORBIDDEN;
      else if (status === HttpStatus.NOT_FOUND) code = ERROR_CODES.NOT_FOUND;
      else if (status === HttpStatus.CONFLICT) code = ERROR_CODES.CONFLICT;
      else if (status === HttpStatus.BAD_REQUEST) code = ERROR_CODES.VALIDATION;
      else if (status === HttpStatus.PAYLOAD_TOO_LARGE) code = ERROR_CODES.PAYLOAD_TOO_LARGE;
      else if (status === HttpStatus.UNSUPPORTED_MEDIA_TYPE)
        code = ERROR_CODES.UNSUPPORTED_MEDIA_TYPE;
      else if (status === 429) code = ERROR_CODES.TOO_MANY_REQUESTS;

      message = typeof exResp === 'string' ? exResp : exResp?.message || exception.message;
      if (exResp && typeof exResp === 'object' && exResp.code) code = exResp.code;
      if (exResp && typeof exResp === 'object' && exResp.details) details = exResp.details;
      if ((exception as any)?.code) code = (exception as any).code;
      if ((exception as any)?.details) details = (exception as any).details;

      if (
        exception instanceof BadRequestException &&
        typeof exResp === 'object' &&
        Array.isArray(exResp.message)
      ) {
        details = exResp.message;
        message = exResp.error || message;
      }
    } else if (exception instanceof ZodError) {
      status = 400;
      code = ERROR_CODES.VALIDATION;
      message = 'Validation failed';
      details = exception.issues.map((i) => ({ path: i.path.join('.'), msg: i.message }));
    } else if (exception && (exception as any)?.code === 'P2002') {
      status = HttpStatus.CONFLICT;
      code = ERROR_CODES.CONFLICT;
      message = 'Duplicate value not allowed';
      details = (exception as any).meta?.target;
    } else if (exception && (exception as any)?.code === 'P2034') {
      status = HttpStatus.CONFLICT;
      code = ERROR_CODES.CONFLICT;
      message = 'Record changed concurrently. Refresh before retrying.';
    } else if (exception && (exception as any)?.code === 'P2025') {
      status = HttpStatus.NOT_FOUND;
      code = ERROR_CODES.NOT_FOUND;
      message = 'Record not found';
    } else if (exception instanceof Error) {
      message = productionLike ? 'Something went wrong' : exception.message;
      if (!productionLike) details = exception.stack;
    }

    if (status >= 500) {
      // Log correlation metadata, never request bodies, tokens, SQL or error messages.
      this.logger.error(
        JSON.stringify({
          event: 'request_failed',
          requestId: req?.id,
          method: req?.method,
          route: req?.route?.path,
          status,
          errorType: exception instanceof Error ? exception.name : 'UnknownError',
        }),
      );
      if (productionLike) {
        message = status === 503 ? 'Service temporarily unavailable' : 'Something went wrong';
        details = undefined;
      }
    }

    const payload: ErrorPayload = {
      success: false,
      error: { code, message, details },
    };

    if (req?.id) {
      res.setHeader('X-Request-Id', req.id);
    }
    res.status(status).json(payload);
  }
}
