import { randomUUID } from 'node:crypto';
import { json, urlencoded, Express, Request, ErrorRequestHandler } from 'express';
import { HttpException } from '@nestjs/common';

export function configureHttpServer(server: Express, trustedProxies: string[]) {
  server.disable('x-powered-by');
  server.set('trust proxy', trustedProxies.length ? trustedProxies : false);
  // Set response metadata before body parsing, including parser failures.
  server.use((req: Request & { id?: string }, res, next) => {
    const incoming = req.get('x-request-id') || req.get('x-correlation-id');
    req.id = incoming && /^[a-zA-Z0-9._-]{1,128}$/.test(incoming) ? incoming : randomUUID();
    res.setHeader('X-Request-Id', req.id);
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  server.use(json({ limit: '1mb' }));
  server.use(urlencoded({ extended: false, limit: '1mb', parameterLimit: 100 }));
  const parserErrors: ErrorRequestHandler = (error, _req, _res, next) => {
    const known: Record<string, [number, string]> = {
      'entity.parse.failed': [400, 'Invalid request body'],
      'entity.too.large': [413, 'Request body is too large'],
      'parameters.too.many': [413, 'Too many request parameters'],
      'encoding.unsupported': [415, 'Unsupported request encoding'],
      'charset.unsupported': [415, 'Unsupported request charset'],
      'request.aborted': [400, 'Request aborted'],
      'request.size.invalid': [400, 'Invalid request size'],
    };
    const mapped = known[error?.type];
    // Parser messages can contain submitted input; never echo it in an API response.
    next(mapped ? new HttpException(mapped[1], mapped[0]) : error);
  };
  server.use(parserErrors);
}
