import { redactAuditValue } from './audit-log.interceptor';
describe('audit redaction', () => {
  it('removes nested credentials from request bodies and database snapshots', () => {
    const value = {
      password: 'password-value',
      nested: { refreshToken: 'refresh-value', twoFactorSecret: 'mfa-value' },
      snapshots: [{ passwordHash: 'hash-value', apiKey: 'key-value', otp: '123456' }],
      action: 'UPDATE',
    };
    const output = redactAuditValue(value);
    expect(output).toEqual({
      password: '[REDACTED]',
      nested: { refreshToken: '[REDACTED]', twoFactorSecret: '[REDACTED]' },
      snapshots: [{ passwordHash: '[REDACTED]', apiKey: '[REDACTED]', otp: '[REDACTED]' }],
      action: 'UPDATE',
    });
    expect(value.password).toBe('password-value');
  });
  it('preserves useful audit values and date serialization', () => {
    expect(redactAuditValue({ amount: 20, active: false, date: new Date('2026-01-01Z') })).toEqual({
      amount: 20,
      active: false,
      date: '2026-01-01T00:00:00.000Z',
    });
  });
});
