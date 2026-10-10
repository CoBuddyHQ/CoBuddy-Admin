import { z } from 'zod';
import { isIP } from 'node:net';

const duration = z
  .string()
  .regex(/^[1-9]\d{0,6}[smhdwy]$/, 'Use a positive duration such as 15m or 7d');

const trustedProxies = z
  .string()
  .default('')
  .transform((value, ctx) => {
    if (!value.trim()) return [];
    const entries = value.split(',').map((entry) => entry.trim());
    for (const entry of entries) {
      const parts = entry.split('/');
      const version = isIP(parts[0]);
      const bits = version === 4 ? 32 : 128;
      if (
        !version ||
        parts.length > 2 ||
        (parts.length === 2 &&
          (!/^\d+$/.test(parts[1]) || Number(parts[1]) < 1 || Number(parts[1]) > bits))
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Use explicit proxy IP addresses or non-zero CIDR ranges, not booleans or hop counts',
        });
        return z.NEVER;
      }
    }
    return entries;
  });

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().min(1024).max(65535).default(4000),
    DATABASE_URL: z
      .string()
      .url()
      .regex(/^postgres(ql)?:\/\//, 'Must be a PostgreSQL URL'),
    DIRECT_URL: z.string().url().optional(),
    REDIS_URL: z
      .string()
      .url()
      .regex(/^rediss?:\/\//, 'Must be a Redis URL'),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_MFA_SECRET: z.string().min(32),
    JWT_ACCESS_TTL: duration.default('15m'),
    JWT_REFRESH_TTL: duration.default('7d'),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
    ENCRYPTION_KEY_PII: z.string().regex(/^[a-fA-F0-9]{64}$/, 'Must be 64 hexadecimal characters'),
    AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
    AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    AWS_REGION: z.string().default('ap-south-1'),
    S3_BUCKET_PRIVATE: z.string().optional(),
    S3_BUCKET_PUBLIC: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM_NAME: z.string().default('CoBuddy Admin'),
    EMAIL_FROM_ADDR: z.string().email().default('no-reply@cobuddy.in'),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    FRONTEND_URL: z.string().url().default('http://localhost:3000'),
    TRUST_PROXY: trustedProxies,
  })
  .superRefine((config, ctx) => {
    if (!['production', 'staging'].includes(config.NODE_ENV)) return;
    for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'JWT_MFA_SECRET'] as const) {
      if (/replace|change.?me|example|^(.)\1+$/i.test(config[key])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: 'Use a unique generated secret',
        });
      }
    }
    if (
      new Set([config.JWT_ACCESS_SECRET, config.JWT_REFRESH_SECRET, config.JWT_MFA_SECRET]).size !==
      3
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_ACCESS_SECRET'],
        message: 'JWT secrets must differ',
      });
    }
    if (/^(.)\1+$/.test(config.ENCRYPTION_KEY_PII)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ENCRYPTION_KEY_PII'],
        message: 'Use a generated encryption key',
      });
    }
    for (const [key, values] of [
      ['FRONTEND_URL', [config.FRONTEND_URL]],
      ['CORS_ORIGIN', config.CORS_ORIGIN.split(',')],
    ] as const) {
      for (const value of values) {
        try {
          const url = new URL(value.trim());
          if (
            url.protocol !== 'https:' ||
            url.username ||
            url.password ||
            url.pathname !== '/' ||
            url.search ||
            url.hash ||
            url.hostname === 'localhost' ||
            url.hostname.endsWith('.localhost') ||
            url.hostname === '[::1]' ||
            url.hostname === '[::]' ||
            url.hostname === '0.0.0.0' ||
            url.hostname.startsWith('127.')
          )
            throw new Error();
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: 'Use explicit HTTPS production origins',
          });
        }
      }
    }
    if (!config.RESEND_API_KEY || /xxx|replace|example/i.test(config.RESEND_API_KEY)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['RESEND_API_KEY'],
        message: 'Configure password recovery email delivery',
      });
    }
  });

export type EnvVars = z.infer<typeof envSchema>;
export function validate(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    // Validation diagnostics contain names, never environment values.
    throw new Error(
      'Environment validation failed:\n' +
        result.error.issues
          .map((issue) => ` [${issue.path.join('.')}]: ${issue.message}`)
          .join('\n'),
    );
  }
  return result.data;
}
