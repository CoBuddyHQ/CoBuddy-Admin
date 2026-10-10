import { envSchema } from './env.validation';
const valid = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://u:p@db:5432/cobuddy',
  REDIS_URL: 'rediss://cache:6379',
  JWT_ACCESS_SECRET: 'a'.repeat(31) + '1',
  JWT_REFRESH_SECRET: 'b'.repeat(31) + '2',
  JWT_MFA_SECRET: 'c'.repeat(31) + '3',
  ENCRYPTION_KEY_PII: '0123456789abcdef'.repeat(4),
  CORS_ORIGIN: 'https://admin.cobuddy.in',
  FRONTEND_URL: 'https://admin.cobuddy.in',
  RESEND_API_KEY: 're_generated-key',
};
describe('production configuration', () => {
  it('accepts TLS Redis and explicit production origins', () =>
    expect(envSchema.safeParse(valid).success).toBe(true));
  it.each([
    { JWT_ACCESS_SECRET: 'replace_me_access_secret_min_32_chars' },
    { JWT_MFA_SECRET: valid.JWT_ACCESS_SECRET },
    { CORS_ORIGIN: '*' },
    { FRONTEND_URL: 'http://localhost:3000' },
    { FRONTEND_URL: 'https://127.0.0.1' },
    { FRONTEND_URL: 'https://[::1]' },
    { FRONTEND_URL: 'https://admin.cobuddy.in/login' },
    { CORS_ORIGIN: 'https://admin.cobuddy.in?redirect=bad' },
    { CORS_ORIGIN: 'https://admin.cobuddy.in/#fragment' },
    { CORS_ORIGIN: 'https://admin.cobuddy.in,' },
    { JWT_ACCESS_TTL: 'invalid' },
    { JWT_REFRESH_TTL: '0d' },
    { TRUST_PROXY: 'true' },
    { TRUST_PROXY: '1' },
    { TRUST_PROXY: '0.0.0.0/0' },
    { TRUST_PROXY: '::/0' },
    { TRUST_PROXY: '10.0.0.1/33' },
    { TRUST_PROXY: '127.0.0.1,' },
    { ENCRYPTION_KEY_PII: 'x'.repeat(64) },
    { RESEND_API_KEY: '' },
  ])('rejects unsafe settings %j', (override) =>
    expect(envSchema.safeParse({ ...valid, ...override }).success).toBe(false),
  );
  it('defaults to no trusted proxies and accepts explicit ingress ranges', () => {
    expect(envSchema.parse(valid).TRUST_PROXY).toEqual([]);
    expect(envSchema.parse({ ...valid, TRUST_PROXY: '10.20.0.0/24, ::1/128' }).TRUST_PROXY).toEqual(
      ['10.20.0.0/24', '::1/128'],
    );
  });
});
