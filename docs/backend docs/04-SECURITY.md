# CoBuddy Backend - Security Implementation Guide

This document is **MANDATORY READING** before writing any code.
CoBuddy handles: financial data, KYC documents, minors' safety escalations, legal evidence, and staff authorization. A breach here = existential business risk.

Every rule below is **non-negotiable** for production release.

---

## Index

1. [Secrets & Environment Variables](#1-secrets--environment-variables)
2. [Authentication Deep Dive](#2-authentication-deep-dive)
3. [Authorization (RBAC + City Scope)](#3-authorization-rbac--city-scope)
4. [Input Validation (Stop SQLi / NoSQLi / XSS)](#4-input-validation)
5. [Rate Limiting & Abuse Prevention](#5-rate-limiting--abuse-prevention)
6. [Output Encoding & Response Safety](#6-output-encoding--response-safety)
7. [PII Encryption at Rest & in Transit](#7-pii-encryption-at-rest--in-transit)
8. [File Uploads (S3) — Security](#8-file-uploads-s3--security)
9. [Audit Trail (Non-repudiation)](#9-audit-trail-non-repudiation)
10. [Financial Integrity (Double-Entry Ledger)](#10-financial-integrity-double-entry-ledger)
11. [Legal Evidence Chain (Incidents + Legal Requests)](#11-legal-evidence-chain-incidents--legal-requests)
12. [CORS, CSRF, Cookie Security](#12-cors-csrf-cookie-security)
13. [Helmet & Security Headers](#13-helmet--security-headers)
14. [Dependency & Supply Chain Security](#14-dependency--supply-chain-security)
15. [Logging: Never Log Secrets](#15-logging-never-log-secrets)
16. [Deployment Hardening](#16-deployment-hardening)
17. [Penetration Test Checklist](#17-penetration-test-checklist)

---

## 1. Secrets & Environment Variables

### NEVER commit `.env`
Ensure `.env` is in `.gitignore`. Provide only `.env.example` with placeholders, **never real values**.

### Validate ALL env vars at startup (Zod)
If any required var is missing, the app **must crash immediately** with a clear error:

```typescript
// src/config/configuration.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),

  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  DIRECT_URL:  z.string().url().startsWith('postgresql://').optional(),

  REDIS_URL: z.string().url().startsWith('redis://'),

  JWT_ACCESS_SECRET:  z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_MFA_SECRET:     z.string().min(32), // For step1 → step2 short token
  JWT_ACCESS_TTL:     z.string().default('15m'),
  JWT_REFRESH_TTL:    z.string().default('7d'),

  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  AWS_ACCESS_KEY_ID:     z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_REGION:            z.string().default('ap-south-1'),
  S3_BUCKET_PRIVATE:     z.string(), // KYC + evidence
  S3_BUCKET_PUBLIC:      z.string(), // profile pics (CDN fronted)
  S3_PRESIGN_UPLOAD_TTL: z.coerce.number().default(300), // 5 min
  S3_PRESIGN_DOWNLOAD_TTL: z.coerce.number().default(60), // 60 seconds for sensitive docs

  RESEND_API_KEY:   z.string().optional(),
  EMAIL_FROM_NAME:  z.string().default('CoBuddy Admin'),
  EMAIL_FROM_ADDR:  z.string().email(),

  CORS_ORIGIN:      z.string().default('http://localhost:3000'),
  FRONTEND_URL:     z.string().url().default('http://localhost:3000'),

  ENCRYPTION_KEY_PII: z.string().length(64), // hex-encoded 256-bit AES key
});

export const env = envSchema.parse(process.env);
```

### Secret Rotation Plan
- JWT secrets — rotate quarterly (key versioning in JWT `kid` header)
- S3 keys — rotate every 90 days via IAM
- AES-PII key — rotate every 6 months (keep old key for re-encryption)

---

## 2. Authentication Deep Dive

### Password Hashing
**Use bcrypt with cost=12**. NOT SHA-1, MD5, or unsalted anything.

```typescript
import * as bcrypt from 'bcrypt';

// Hash
const passwordHash = await bcrypt.hash(plainPassword, env.BCRYPT_SALT_ROUNDS);

// Verify
const ok = await bcrypt.compare(plainPassword, storedHash);
if (!ok) throw new UnauthorizedException('Invalid credentials');
```

Max password length 72 bytes (bcrypt limit). Enforce min length 8 chars in validation.

### JWT Strategy
- **Access token**: 15 minute expiry, HS256, carries `sub`, `roles[]`, `cityScope[]`, `employeeId`, `email`
- **Refresh token**: 7 day expiry, stored in DB (`StaffSession` table), **rotated on every use** (reuse detection)
- **Never store access tokens in DB**; only refresh tokens

Access token claims:
```json
{
  "sub": "emp-uuid-123",
  "employeeId": "EMP-001",
  "email": "admin@cobuddy.com",
  "roles": ["SUPER_ADMIN"],
  "cityScope": [],
  "name": "Admin User",
  "type": "access",
  "iat": 1712345678,
  "exp": 1712346578
}
```

### 2FA (TOTP — Google Authenticator / Authy)
```bash
npm install otplib qrcode
```

Setup:
```typescript
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

// On enable-2fa
const secret = authenticator.generateSecret(); // 32 char base32
await prisma.staffEmployee.update({ where: { id }, data: { twoFactorSecret: secret } });
const otpAuthUrl = authenticator.keyuri(email, 'CoBuddy Admin', secret);
const qrDataUrl = await QRCode.toDataURL(otpAuthUrl);
return { qrDataUrl, secret, backupCodes: generateBackupCodes() };

// Verify OTP on login
authenticator.options = { window: 1 }; // Allow ±30s drift
const isValid = authenticator.check(otp, storedSecret);
```

Generate 8 backup codes (bcrypt-hashed, shown ONCE).

### Login Rate Limiting (CRITICAL)
Per-IP + per-email: max 5 attempts / 15 min. After lockout → cool-down + CAPTCHA.
Log every attempt (success and failure).

### Force Logout (Sessions List)
`POST /auth/force-logout` → delete all `StaffSession` rows for employee → every refresh instantly fails.

### Suspended Account Check
In JwtStrategy.validate() — re-check `employee.status === ACTIVE` from DB **on every token use**.
If suspended → throw 401 immediately (catches session still valid after HR suspended).

---

## 3. Authorization (RBAC + City Scope)

### Three Layers of Guards (ALL MUST PASS)

#### Layer 1: JwtAuthGuard
Ensures JWT valid, user present in `req.user`.

#### Layer 2: RolesGuard
```typescript
// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<StaffRole[]>('roles', [
      ctx.getHandler(), ctx.getClass(),
    ]) ?? [];
    if (!requiredRoles.length) return true;

    const user = ctx.switchToHttp().getRequest().user as JwtPayload;
    // SUPER_ADMIN bypasses everything per permissions.ts:line75
    if (user.roles.includes(StaffRole.SUPER_ADMIN)) return true;

    return requiredRoles.some(r => user.roles.includes(r));
  }
}
```

Usage:
```typescript
@Controller('financial/payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayoutsController {
  @Get()
  @Roles(StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN)
  findAll(@Query() query, @CurrentUser() user) { ... }
}
```

#### Layer 3: CityScopeGuard
For `CITY_OPS_MANAGER` role — append city filter automatically and block cross-city access at QUERY level.

```typescript
@Injectable()
export class CityScopeGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const user: JwtPayload = req.user;
    if (user.roles.includes(StaffRole.SUPER_ADMIN)) return true;
    if (!user.roles.includes(StaffRole.CITY_OPS_MANAGER)) return true;

    // Store scoped city IDs for service layer to inject into Prisma where
    req.scopedCityIds = user.cityScope;
    return true;
  }
}
```

In EVERY service method, if user has CITY_OPS role:
```typescript
return this.prisma.booking.findMany({
  where: {
    cityId: user.cityScope ? { in: user.cityScope } : undefined, // mandatory
    status: 'COMPLETED',
  },
});
```

#### Data Leak Test Cases (Must test in E2E)
1. CITY_OPS for CITY-1 tries to fetch booking from CITY-2 → must return 404 / empty result set
2. FINANCE_ADMIN tries to access SOS incidents → 403
3. SUPPORT_AGENT tries to change commission config → 403
4. MODERATOR tries to list employees → 403 (only HR_ADMIN + SUP)

---

## 4. Input Validation

The running API uses Nest's global `ValidationPipe` and class-validator DTOs with
whitelisting, transformation and rejection of unexpected fields. Zod validates
environment configuration. The old unused `ZodValidationPipe` has been removed.
The Zod controller examples below are design references, not the deployed wiring.

### ZodValidationPipe (Global)
```typescript
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const schema = metadata.metatype?.prototype?.ZOD_SCHEMA;
    if (!schema) return value;
    const result = schema.safeParse(value);
    if (!result.success) {
      const details = result.error.issues.map(i => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      throw new HttpException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details }
      }, 400);
    }
    return result.data;
  }
}
```

Example DTO with Zod:
```typescript
// employees/dto/create-employee.dto.ts
export const CreateEmployeeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(254).transform(s => s.toLowerCase()),
  phone: z.string().regex(/^\+\d{1,3}\s?\d{10}$/, 'Must be E.164'),
  designation: z.string().min(2).max(100),
  department: z.nativeEnum(EmployeeDepartment),
  reportingManagerId: z.string().uuid().optional(),
  roles: z.array(z.nativeEnum(StaffRole)).min(1),
  cityScope: z.array(z.string().uuid()).optional(),
});

export type CreateEmployeeDto = z.infer<typeof CreateEmployeeSchema>;
// Attach schema so ZodValidationPipe finds it
CreateEmployeeSchema.prototype = { ZOD_SCHEMA: CreateEmployeeSchema };
```

### Query String Validation
Every `findAll` must validate sortBy against allow-list to prevent:
- `?sortBy=passwordHash` (info leak)
- `?sortBy=SELECT+*+FROM+...` (SQL injection via ORDER BY — actually possible if raw query)

```typescript
const sortByAllowList = ['createdAt', 'name', 'status', 'email', 'joinDate'] as const;
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(sortByAllowList).default('createdAt'),
  sortOrder: z.enum(['asc','desc']).default('desc'),
  search: z.string().max(100).default(''),
  filters: z.record(z.string(), z.union([z.string(), z.array(z.string())])).default({}),
});
```

### NEVER build SQL strings with user input
Prisma parameterized queries ONLY. Even for `filters[]` -> map to `where` keys explicitly. No `raw` unless you can prove it's safe.

---

## 5. Rate Limiting & Abuse Prevention

### Tiered Throttling (NestJS `@nestjs/throttler` + Redis store)

```typescript
// throttler.config.ts
export const throttlerConfig = [
  { name: 'strict',    ttl: 900,  limit: 5 },   // login / 2FA endpoints
  { name: 'standard',  ttl: 60,   limit: 120 }, // general read
  { name: 'write',     ttl: 60,   limit: 60 },  // mutation endpoints
  { name: 'financial', ttl: 300,  limit: 20 },  // payouts / refunds
  { name: 'search',    ttl: 10,   limit: 30 },  // autocomplete / search
];
```

Use decorator per endpoint:
```typescript
@Post('auth/login')
@Throttle({ default: { limit: 5, ttl: 900 } })
login(@Body() dto) {}
```

### CAPTCHA on Repeated Failures
3 failed logins from same IP → require hCaptcha / Turnstile token.

### API Key Optional (Internal micro-services)
If a service talks to backend (e.g., mobile app backend → admin backend), use service-to-service JWT with separate signing key + scope `service:write`.

---

## 6. Output Encoding & Response Safety

### NEVER Return Password Hashes / 2FA Secrets
Even for SUPER_ADMIN. Use Prisma `omit: { passwordHash: true, twoFactorSecret: true }` everywhere.

Global Prisma extension:
```typescript
const staffOmit = Prisma.defineExtension((client) =>
  client.$extends({
    name: 'staffOmit',
    query: {
      $allModels: {
        async $allOperations({ args, query, model }) {
          if (model === 'StaffEmployee' || model === 'Customer' || model === 'Companion') {
            // @ts-expect-error - omit typing
            args.omit = { ...args.omit, passwordHash: true, twoFactorSecret: true };
          }
          return query(args);
        },
      },
    },
  })
);
```

### Sanitize User-Generated Text (XSS Prevention)
Any free-text (`description`, `note`, `review.text`, `ticket subject`) — sanitize with `DOMPurify` / `sanitize-html` when rendering, and strip dangerous tags on store.

### Mask PII in Lists
On list endpoints, return phone only as `+91 98******21`, email as `r***@example.com` unless:
- SUPPORT_LEAD / FINANCE / SUP role → full visibility
- Export CSV → encrypt + password protect

---

## 7. PII Encryption at Rest & in Transit

### TLS In Transit
- ALL production endpoints: HTTPS only (HSTS header via Helmet `maxAge: 31536000`)
- Local dev: you may use HTTP but stage must be HTTPS-only
- Database connections: `?sslmode=require` in DATABASE_URL
- Redis: TLS + AUTH token (never bare Redis in prod)

### AES-256-GCM Encryption for PII Columns
Implementation status: the standalone PII helper was unused and has been removed.
There is no integrated Prisma PII encryption layer in this application. The design
below still requires implementation, migration and verification; having an
`ENCRYPTION_KEY_PII` variable does not mean stored fields are encrypted.

Encrypt these columns BEFORE writing, decrypt on read (transparent via Prisma extension):
```
StaffEmployee:  phone, email (optional but recommended + unique index on hash)
Customer:       phone, email
Companion:      phone, email, bankAccounts.accountNumber, bankAccounts.ifscCode, upiId
BankAccount:    accountNumber, ifscCode, upiId
LegalRequest:   caseReference, targetUserId
```

Encryption recipe:
```typescript
// lib/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALG = 'aes-256-gcm';

export function encryptPII(plain: string): string {
  const key = scryptSync(env.ENCRYPTION_KEY_PII, 'pii-salt', 32);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${enc.toString('base64')}`;
}

export function decryptPII(blob: string): string {
  const [iv64, tag64, enc64] = blob.split('.');
  const key = scryptSync(env.ENCRYPTION_KEY_PII, 'pii-salt', 32);
  const iv = Buffer.from(iv64, 'base64');
  const tag = Buffer.from(tag64, 'base64');
  const enc = Buffer.from(enc64, 'base64');
  const decipher = createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
```

**For unique constraints on email/phone** — store an additional HMAC-SHA256 column `emailHash` with a pepper key, create UNIQUE index on the hash, never on the ciphertext.

---

## 8. File Uploads (S3) — Security

### Architecture
1. Frontend requests `POST /uploads/presign { purpose, contentType, fileName, entityId }`
2. Backend validates:
   - Purpose allow-list (`KYC_ID`, `KYC_SELFIE`, `REPORT_EVIDENCE`, `INCIDENT_EVIDENCE`, `TICKET_ATTACHMENT`, `PROFILE_PIC`)
   - Max size per purpose (KYC ≤ 5MB per image, attachment ≤ 10MB per file, audio ≤ 25MB)
   - Content-Type allow-list (images: image/png, image/jpeg; docs: application/pdf; audio: audio/mpeg, audio/webm)
   - User permission on entityId (e.g., only FINANCE_ADMIN can attach to a payout)
3. Backend returns presigned PUT URL for S3 **with server-side encryption** (`SSE:AES256`)
4. Frontend uploads bytes DIRECTLY to S3 → never hits Node.js
5. After success, frontend calls `POST /uploads/:fileId/confirm` → backend stores metadata in `StoredFile` table
6. Downloads for sensitive docs ALWAYS go through `GET /uploads/:fileId/download` (backend validates permissions + returns URL with 60s TTL only)

### Bucket Policies
- **`cobuddy-private`**: Block ALL public access. Only presigned URLs.
  - Folder structure: `/kyc/`, `/evidence/`, `/legal/`, `/chats/`, `/training/`
  - Life cycle rule: `evidence` with `preserveEvidence=true` = DO NOT DELETE for minimum 7 years (legal hold flag on S3)
- **`cobuddy-public`**: Profile pics, banners only. CloudFront CDN + signed URLs optional.

### Anti-Malware (Optional But Recommended)
On object created → trigger AWS Lambda ClamAV scan (or use S3 Object Lambda + VirusTotal API) → tag object → backend checks `infected:true` tag on download and refuses.

---

## 9. Audit Trail (Non-repudiation)

Every **write** (POST/PUT/PATCH/DELETE) plus auth events and financial actions MUST produce exactly 1 `AuditLog` row.

### Implementation Approach: Decorator + Interceptor
```typescript
// decorators/audit-log.decorator.ts
export const AUDIT_LOG_KEY = 'audit_log_meta';
export const AuditLog = (action: string, moduleAffected: string, opts?: { captureDiff?: boolean }) =>
  SetMetadata(AUDIT_LOG_KEY, { action, moduleAffected, captureDiff });

// interceptors/audit-log.interceptor.ts
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  async intercept(ctx: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const meta = this.reflector.get(AUDIT_LOG_META, ctx.getHandler());
    if (!meta) return next.handle();
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    const ip = this.extractIp(req);

    // 1. If captureDiff -> fetch old entity BEFORE handler runs
    let oldValues = null;
    if (meta.captureDiff && req.params.id) {
      oldValues = await this.fetchEntityBefore(ctx, req.params.id);
    }

    return next.handle().pipe(tap(async (responsePayload) => {
      // 2. After handler success -> write AuditLog
      let newValues = null;
      if (meta.captureDiff) {
        newValues = responsePayload?.data ?? null;
      }
      await this.prisma.auditLog.create({
        data: {
          adminId: user.sub,
          adminName: user.name,
          action: meta.action,
          moduleAffected: meta.moduleAffected,
          details: `${meta.action} ${meta.moduleAffected}`,
          ipAddress: ip,
          userAgent: req.headers['user-agent']?.slice(0, 512) ?? null,
          resourceType: guessResourceType(meta.moduleAffected),
          resourceId: req.params.id ?? responsePayload?.data?.id ?? null,
          oldValues, newValues,
        }
      });
    }));
  }
}
```

### Usage on Controllers
```typescript
@Patch(':id/roles')
@Roles(StaffRole.SUPER_ADMIN, StaffRole.HR_ADMIN)
@AuditLog('UPDATE_ROLES', 'Employee Management', { captureDiff: true })
updateRoles(@Param('id') id: string, @Body() body) {
  return this.employeesService.updateRoles(id, body);
}
```

### Non-repudiation
Once written, `AuditLog` rows must be **APPEND-ONLY**. NEVER create `DELETE /audit-logs/:id` endpoint, EVER.
Add DB-level trigger to prevent UPDATE/DELETE on `audit_log` table for the app DB user:

```sql
-- pg-init.sql (run as superuser once)
REVOKE UPDATE, DELETE ON audit_log FROM cobuddy_app_user;
```

---

## 10. Financial Integrity (Double-Entry Ledger)

### NEVER update `wallet.balance` directly
Every balance change goes through `WalletLedgerService.postTransaction()` in a SINGLE PostgreSQL transaction:

```typescript
@Injectable()
export class WalletLedgerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Double-entry posting.
   * debitWalletId  = wallet that loses money
   * creditWalletId = wallet that receives money
   * Every call must have BOTH or you get ledger imbalance (throw).
   */
  async postTransfer(input: {
    debitWalletId: string;
    creditWalletId: string;
    category: WalletTransactionCategory;
    amount: Decimal;
    bookingId?: string;
    description: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Lock rows with SELECT ... FOR UPDATE to prevent race
      const debitWallet = await tx.wallet.findUnique({
        where: { id: input.debitWalletId },
        select: { id: true, balance: true, ledgerVersion: true },
      });
      const creditWallet = await tx.wallet.findUnique({
        where: { id: input.creditWalletId },
        select: { id: true, balance: true, ledgerVersion: true },
      });
      if (!debitWallet || !creditWallet) throw new Error('WALLET_NOT_FOUND');

      // 2. Sufficient funds check (ignore platform internal wallet)
      const isInternalDebit = debitWallet.id.startsWith('int-platform');
      if (!isInternalDebit && debitWallet.balance.lessThan(input.amount)) {
        throw new HttpException({ code: 'INSUFFICIENT_FUNDS' }, 402);
      }

      // 3. Update wallets + optimistic locking version
      const newDebitBal = debitWallet.balance.minus(input.amount);
      const newCreditBal = creditWallet.balance.plus(input.amount);
      await tx.wallet.update({
        where: { id: debitWallet.id, ledgerVersion: debitWallet.ledgerVersion },
        data: { balance: newDebitBal, ledgerVersion: { increment: 1 }, lastSpendAt: new Date() },
      });
      await tx.wallet.update({
        where: { id: creditWallet.id, ledgerVersion: creditWallet.ledgerVersion },
        data: { balance: newCreditBal, ledgerVersion: { increment: 1 }, lastTopupAt: new Date() },
      });

      // 4. Two mirror ledger entries (one debit, one credit) for same logical tx
      await tx.walletTransaction.createMany({
        data: [
          {
            walletId: input.debitWalletId,
            transactionType: 'DEBIT',
            category: input.category,
            amount: input.amount,
            balanceAfter: newDebitBal,
            description: input.description,
            bookingId: input.bookingId,
          },
          {
            walletId: input.creditWalletId,
            transactionType: 'CREDIT',
            category: input.category,
            amount: input.amount,
            balanceAfter: newCreditBal,
            description: input.description,
            bookingId: input.bookingId,
          },
        ],
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
```

### Wallet Consistency Check (Cron Job Every Hour)
```
SUM(walletTransactions.credit) - SUM(walletTransactions.debit)  ==  SUM(wallets.balance)
```
If mismatch → log at `CRITICAL` level + email FINANCE_ADMIN + SUP immediately. THIS SIGNALS BUG.

### Payout Processing
- FINANCE_ADMIN clicks Process → Bulk enqueue into BullMQ queue (NOT inline HTTP)
- 1 payout per job → idempotent (payoutId as deduplication key)
- After gateway success → single DB tx: update payout.status=PAID + post wallet transfer (companion wallet → platform cash-out wallet) + create tax invoice draft + audit log

**REQUIRED**: No manual DB edits to financial tables via psql. If corrections needed, use Admin `POST /adjust-wallet` endpoint with audit trail + finance approval note.

---

## 11. Legal Evidence Chain (Incidents + Legal Requests)

### Evidence Preservation = Legal Hold
When `preserveEvidence = true` on `SafetyIncident`:
1. Backend S3 `putObjectLegalHold` (object lock mode `COMPLIANCE` — CANNOT BE DELETED until hold released)
2. Create `LegalRequest` record with `preserveUntil = max(now + 7yr, court-order date)`
3. S3 Lifecycle: Do NOT delete any object with LegalHold tag before that date

### Chain of Custody
Every evidence file must have a manifest:
- SHA-256 hash on upload confirmation (frontend computes hash, backend verifies via `presign` extra checksum field OR backend recomputes with S3 checksum)
- Who uploaded, when, IP, related incident/report ID
- Timestamp RFC 3161 (optional, but can use AWS timestamp service)

### Data Privacy (RTBF = Right to be Forgotten)
ERASURE request MUST:
1. Anonymize `Customer`: replace name=`Deleted User`, email=`deleted_UUID@invalid`, phone hash nulled, profilePicUrl deleted
2. Soft-delete chat messages with user (not physical delete if open incident)
3. EXCEPTION → DO NOT DELETE if open LegalRequest or SafetyIncident with preserveEvidence (GDPR/DPDPA exception). Show notice to user "Data retained for ongoing legal case".
4. FINANCIAL RETENTION → 7 years (Indian Income Tax Act). Wallet ledger rows NEVER deleted.
5. Generate a DSAR completion certificate PDF + email.

---

## 12. CORS, CSRF, Cookie Security

### CORS (White-list Only)
```typescript
// main.ts OR app.module.ts
const cors = {
  origin: (origin, cb) => {
    const whitelist = env.CORS_ORIGIN.split(',');
    if (env.NODE_ENV === 'development') whitelist.push('http://localhost:3000','http://127.0.0.1:3000');
    if (whitelist.includes(origin) || !origin) return cb(null, true);
    return cb(new Error('CORS_BLOCKED'));
  },
  credentials: true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE'],
  allowedHeaders: ['Content-Type','Accept','Authorization','X-Request-Id','X-Correlation-ID'],
  exposedHeaders: ['X-Request-Id'],
};
app.enableCors(cors);
```

### CSRF Protection
- State-changing endpoints (NOT GET/HEAD/OPTIONS) require `X-CSRF-Token` header if cookies are used for refresh tokens.
- If using Authorization header only (localStorage-based), CSRF is less of a risk, but still enable the csurf package double-submit pattern as defense-in-depth.

### Cookie Security (If you move refresh token to HTTP-only cookie — RECOMMENDED)
```
cookie options:
  httpOnly:  true
  secure:    NODE_ENV === 'production'  (HTTPS only)
  sameSite:  'strict'                  (prevents CSRF)
  domain:    '.cobuddy.in'             (shared root for admin + mobile backend)
  maxAge:    7 days
  path:      '/api/auth'
```

---

## 13. Helmet & Security Headers

Enable in `main.ts`:
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", "data:", "https:"],
      connectSrc: ["'self'", env.FRONTEND_URL],
      frameSrc:   ["'none'"],
      objectSrc:  ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts:              { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard:        { action: 'deny' },
  hidePoweredBy:     true,
  noSniff:           true,
  xssFilter:         true,
  permittedCrossDomainPolicies: { policy: 'none' },
  referrerPolicy:    { policy: 'strict-origin-when-cross-origin' },
}));
```

---

## 14. Dependency & Supply Chain Security

### npm-audit + snyk (CI Gate)
- Add to package.json scripts: `"audit": "npm audit --audit-level=high"`
- Every PR build MUST run `npm audit`; fail on HIGH / CRITICAL.
- Add Snyk / Dependabot — opens automatic PRs for vulns.

### Lock File Integrity
Commit `package-lock.json`. On CI install use `npm ci` instead of `npm install` (respects lockfile exactly).

### Least-privilege IAM Roles for AWS
- Backend service user: ONLY allow `s3:PutObject`, `s3:GetObject` with presign, `ses:SendRawEmail` — NOT full admin access.
- S3 bucket policy: require `aws:SecureTransport: true`, deny plain HTTP.

---

## 15. Logging: Never Log Secrets

### Winston + Pino
Structured JSON logging. NEVER log:
- Passwords, passwords in error messages (don't echo back user input)
- JWT tokens / 2FA secrets
- API keys, encryption keys
- Full credit card / bank account numbers (already encrypted; don't log plain)
- OTP codes

Add a global redact function in logger that scans for patterns:
```
password = ? / jwt = ? / otp = ? / secret = ? / Bearer [A-Za-z0-9-_.]+
```

Replace with `[REDACTED]` before writing logs.

### Request Correlation
Every request → `X-Correlation-ID` (client-supplied or generated). Show in all logs for that request. Helps trace customer bug reports end-to-end.

---

## 16. Deployment Hardening

### Docker (non-root user, read-only fs)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runtime
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/prisma ./prisma
USER app
EXPOSE 4000
CMD ["node", "dist/main.js"]
```
Read-only root filesystem: `docker run --read-only --tmpfs /tmp ...`

### Cloud WAF
Cloudflare or AWS WAF with managed rule sets:
- SQLi, XSS, RCE, LFI/RFI protection
- Rate limit / Bot management (Managed Rules)
- Geo-block: If launching only in India → block CN/RU/UA/BY default (adjust based on threat intel)

### Database Access
- Never expose Postgres port 5432 to 0.0.0.0
- Use Postgres VPC / private subnet + VPC peering
- IAM auth preferred over long passwords; rotate weekly

---

## 17. Penetration Test Checklist (Pre-Launch)

Assign a pen-tester or run OWASP ZAP + manual checks for:

### A01 Broken Access Control
- BOLA (Broken Object Level Authorization): `/customers/OTHER_CUSTOMER_ID/wallet` → logged in as SUPPORT should return 200 with correct data, but as SUPPORT_AGENT without permission → 403
- IDOR test with numeric / UUID increment attempts
- Horizontal + vertical privilege escalation

### A02 Cryptographic Failures
- HTTP endpoint still reachable? → redirect 301 + HSTS
- Weak ciphers? → TLS 1.2 min, modern suite

### A03 Injection
- Submit `' OR 1=1 --` in all search fields, password fields → must not crash / leak data
- XSS via SVG upload in evidence → sanitize or block SVG on upload
- Template injection in email

### A07 Identification & Auth Failures
- Enumeration: Login fails differently for registered vs non-registered email? → same generic error message
- Session fixation → use refresh token rotation
- Missing brute-force protection on login (5 attempts test → lock after 5)

### A08 Software & Data Integrity
- Verify Prisma migrations not tampered: `prisma migrate diff` against prod baseline
- Update CI to verify checksum of deployment package

### A10 SSRF
- If app ever fetches URL from user: `presign` purpose doesn't call external. If you integrate webhooks later → validate URLs against IP allow-list only.

---

## 18. Security Incident Response Plan (SIRP)

Write this before launch (one-pager):
1. Classify severity: P1 (breach of PII/Fin) / P2 / P3
2. P1: Notify CTO + Legal + Data Protection Officer within **4 hours**
3. DPDPA notification to Govt. authority within **72 hours** for personal data breach (India DPDPA)
4. Preserve logs + DB snapshot immediately (S3 copy, no-delete lock)
5. Customer notification timeline: P1 within 48h (per law)
6. Post-mortem in 5 days → fix gaps → add automated test

---

## 19. Next Document

Read **[05-FRONTEND-INTEGRATION.md](./05-FRONTEND-INTEGRATION.md)** for the exact 7-step process to wire the frontend to this backend, including replacing every `api.ts` file with real axios calls.
