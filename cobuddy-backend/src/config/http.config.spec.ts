import express, { ErrorRequestHandler } from 'express';
import request from 'supertest';
import { configureHttpServer } from './http.config';

describe('HTTP transport hardening', () => {
  function app(proxies: string[] = []) {
    const server = express();
    configureHttpServer(server, proxies);
    server.get('/ip', (req, res) => {
      res.json({ ip: req.ip });
    });
    server.get('/query', (req, res) => {
      res.json(req.query);
    });
    server.post('/body', (req, res) => {
      res.json(req.body);
    });
    const errors: ErrorRequestHandler = (error, _req, res, _next) => {
      res.status(error.status || 500).json({ message: error.message });
    };
    server.use(errors);
    return server;
  }

  it('ignores spoofed forwarded IP headers by default', async () => {
    const response = await request(app())
      .get('/ip')
      .set('X-Forwarded-For', '203.0.113.20')
      .expect(200);
    expect(response.body.ip).not.toBe('203.0.113.20');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
  it('uses forwarding only from explicitly trusted ingress IPs', async () => {
    const response = await request(app(['127.0.0.1', '::1']))
      .get('/ip')
      .set('X-Forwarded-For', '203.0.113.20')
      .expect(200);
    expect(response.body.ip).toBe('203.0.113.20');
  });
  it('does not trust a caller outside the configured ingress subnet', async () => {
    const response = await request(app(['10.20.0.0/24']))
      .get('/ip')
      .set('X-Forwarded-For', '203.0.113.20')
      .expect(200);
    expect(response.body.ip).not.toBe('203.0.113.20');
  });
  it('preserves safe request IDs and replaces invalid IDs', async () => {
    const safe = await request(app()).get('/ip').set('X-Request-Id', 'trace-123');
    expect(safe.headers['x-request-id']).toBe('trace-123');
    const invalid = await request(app()).get('/ip').set('X-Request-Id', 'bad <request>');
    expect(invalid.headers['x-request-id']).toMatch(/^[a-f0-9-]{36}$/);
  });
  it('keeps response headers on malformed JSON', async () => {
    const response = await request(app()).post('/body').type('json').send('{broken').expect(400);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-request-id']).toBeTruthy();
    expect(response.body.message).toBe('Invalid request body');
  });
  it('rejects oversized requests with correlation metadata', async () => {
    const response = await request(app())
      .post('/body')
      .send({ value: 'x'.repeat(1024 * 1024) })
      .expect(413);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-request-id']).toBeTruthy();
  });
  it('limits URL-encoded parameter count', async () => {
    await request(app())
      .post('/body')
      .type('form')
      .send(Array.from({ length: 101 }, (_, i) => 'p' + i + '=value').join('&'))
      .expect(413);
  });
  it('preserves bracket-array filters alongside pagination', async () => {
    const response = await request(app())
      .get('/query?page=1&pageSize=200&roles[]=SUPPORT_AGENT&roles[]=CITY_OPS_MANAGER')
      .expect(200);
    expect(response.body).toEqual({
      page: '1',
      pageSize: '200',
      roles: ['SUPPORT_AGENT', 'CITY_OPS_MANAGER'],
    });
  });
  it('does not allow query input to pollute object prototypes', async () => {
    const response = await request(app())
      .get('/query?__proto__[polluted]=yes&constructor[prototype][polluted]=yes&page=1')
      .expect(200);
    expect(response.body.page).toBe('1');
    expect(Object.getPrototypeOf({})).not.toHaveProperty('polluted');
    expect(Object.prototype.hasOwnProperty.call(response.body, '__proto__')).toBe(false);
  });
});
