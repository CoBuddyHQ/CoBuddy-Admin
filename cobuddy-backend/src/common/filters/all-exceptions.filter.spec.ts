import {
  ArgumentsHost,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('API error disclosure', () => {
  const environment = process.env.NODE_ENV;
  let log: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    if (environment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = environment;
    jest.restoreAllMocks();
  });

  function respond(error: unknown) {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn() };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ id: 'request-1', method: 'GET', route: { path: '/customers' } }),
      }),
    } as unknown as ArgumentsHost;
    new AllExceptionsFilter().catch(error, host);
    return response;
  }

  it.each(['production', 'staging'])(
    'redacts internal errors in %s and logs a correlation ID',
    (env) => {
      process.env.NODE_ENV = env;
      for (const error of [
        new Error('database-password-secret'),
        new InternalServerErrorException('private SQL'),
      ]) {
        const response = respond(error);
        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Something went wrong', details: undefined },
        });
      }
      const logs = JSON.stringify(log.mock.calls);
      expect(logs).toContain('request-1');
      expect(logs).not.toContain('database-password-secret');
      expect(logs).not.toContain('private SQL');
    },
  );

  it('preserves useful validation errors without logging request input', () => {
    process.env.NODE_ENV = 'production';
    const response = respond(new BadRequestException(['page must be positive']));
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: ['page must be positive'],
        }),
      }),
    );
    expect(log).not.toHaveBeenCalled();
  });

  it('maps serializable write conflicts to a retryable 409', () => {
    const response = respond({ code: 'P2034' });
    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'CONFLICT' }) }),
    );
  });
});
