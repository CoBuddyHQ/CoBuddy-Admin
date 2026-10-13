# CoBuddy Backend - Architecture & Tech Stack

> Historical design specification. For the implemented folder layout, installed
> runtime/framework versions and feature ownership, use
> [the verified backend structure](../BACKEND_STRUCTURE.md). Provider, Socket.io,
> BullMQ, encryption and observability entries below are design requirements,
> not evidence that those integrations are deployed. The current runtime is
> Node 24.x with NestJS 11, Express 5 and Prisma 5.

## 1. Overview

This document defines the production-grade backend architecture for CoBuddy Admin Panel. The backend must support:
- **42 functional modules** matching the Next.js frontend prototype
- **9 Role-Based Access Control (RBAC)** roles with module-level permissions
- **Real-time features**: Live Map, SOS Alerts, Live Sessions
- **Financial correctness**: Escrow, Payouts, Double-entry wallet ledger
- **Audit & compliance**: Full audit trail, PII encryption, legal evidence chain

---

## 2. Tech Stack (Production-Grade)

| Layer | Technology | Justification |
|---|---|---|
| **Runtime** | Node.js 20+ LTS | Long-term support, stable performance |
| **Framework** | **NestJS 10 + TypeScript Strict** | Modular architecture, built-in DI, Guards, Interceptors, Swagger |
| **Database** | **PostgreSQL 16** | ACID compliance, JSONB support, strong financial data integrity |
| **ORM** | **Prisma ORM 5** | Type-safe queries, declarative migrations, schema as source of truth |
| **Cache / Broker** | **Redis 7** | Sessions, rate limiting, pub/sub, BullMQ job queue, master data cache |
| **Auth** | JWT (Access: 15min + Refresh: 7d), bcrypt@12, otplib (TOTP 2FA) | Industry standard auth pattern |
| **Validation** | **Zod** | Share validators with frontend (same types as `types.ts` in each module) |
| **File Storage** | **AWS S3** (private buckets, presigned URLs) | KYC documents, evidence, chat attachments |
| **Email** | **Resend** OR AWS SES | Invite emails, password reset, ticket replies |
| **SMS** | **Msg91 (India)** OR Twilio | 2FA SMS, SOS alerts |
| **Real-time** | **Socket.io v4** + Redis adapter | Live Map, SOS push, Notifications, Live Sessions |
| **Jobs** | **BullMQ** (Redis-backed) | Payout processing, SLA escalation, report aggregation |
| **Observability** | Winston + Sentry + Prometheus/Grafana | Structured logs, error tracking, metrics |
| **API Docs** | Swagger OpenAPI 3.1 via `@nestjs/swagger` | Auto-generated, always in sync |
| **Testing** | Jest + Supertest | Unit tests + E2E API tests |
| **Container** | Docker + Docker Compose | Postgres, Redis, Nest in single dev env |

### Alternative: Express.js (If NestJS is unfamiliar)
Use: Express v5 + TypeScript + tsyringe (DI) + zod-express-middleware.
But NestJS is **strongly recommended** for a project this size.

---

## 3. Non-Functional Requirements (NFRs)

| Requirement | Target |
|---|---|
| API Latency (p95) | < 200ms for CRUD, < 2s for analytics queries |
| Availability | 99.9% (three 9s) |
| Data durability | RPO = 5 min (PostgreSQL WAL + daily snapshots) |
| Regulatory | GDPR / DPDPA compliance (PII encryption, DSAR workflow) |
| Concurrency | 1000 concurrent admin users minimum |
| Audit | 100% write operations logged with user + IP + timestamp |

---

## 4. Folder Structure (NestJS)

Create a **separate repository** `cobuddy-backend` or use a monorepo with the frontend:

```
cobuddy-backend/
├── src/
│   ├── main.ts                              # Entry point (bootstrap Nest, Swagger, Socket.io)
│   ├── app.module.ts                        # Root module - imports all feature modules
│   │
│   ├── common/                              # Cross-cutting concerns
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts           # @Roles(StaffRole.FINANCE_ADMIN)
│   │   │   ├── current-user.decorator.ts    # @CurrentUser() for injecting StaffUser
│   │   │   ├── city-scope.decorator.ts      # Auto-filter queries by CITY_OPS_MANAGER scope
│   │   │   └── audit-log.decorator.ts       # @AuditLog(action, module) auto-logging
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts            # Validates JWT, attaches user to req
│   │   │   ├── roles.guard.ts               # Checks @Roles() against user.roles
│   │   │   └── city-scope.guard.ts          # Enforces city data boundaries
│   │   ├── filters/
│   │   │   └── all-exceptions.filter.ts     # Catches all errors, returns standardized shape
│   │   ├── interceptors/
│   │   │   ├── audit-log.interceptor.ts     # Reads @AuditLog decorator, writes DB entry
│   │   │   ├── transform.interceptor.ts     # Wraps responses in { success, data, meta }
│   │   │   └── logging.interceptor.ts       # Request/response structured logs
│   │   ├── middleware/
│   │   │   └── correlation-id.middleware.ts # X-Correlation-ID for tracing
│   │   ├── pipes/
│   │   │   └── zod-validation.pipe.ts       # Zod DTO validation -> 400 with field errors
│   │   └── dto/
│   │       ├── paginated.dto.ts             # { page, limit, sortBy, sortOrder, search, filters }
│   │       ├── api-response.dto.ts          # Standard envelope
│   │       └── pagination-meta.dto.ts       # page, totalPages, total, hasNext, hasPrev
│   │
│   ├── config/
│   │   ├── configuration.ts                 # Zod-validated env config
│   │   ├── database.config.ts               # Postgres connection (Prisma)
│   │   ├── jwt.config.ts                    # Secret, expiresIn
│   │   ├── redis.config.ts                  # ioredis client
│   │   ├── s3.config.ts                     # S3 bucket, presigned URL TTL
│   │   └── throttler.config.ts              # Rate limit tiers by endpoint
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts                # ExtendedPrismaClient with $extends helpers
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/                            # POST /api/auth/*
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts              # login, verify2fa, refresh, logout, forgotPwd
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts          # Passport JWT strategy
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       ├── verify-2fa.dto.ts
│   │   │       └── refresh-token.dto.ts
│   │   │
│   │   ├── employees/                       # /api/employees (HR_ADMIN, SUPER_ADMIN)
│   │   │   ├── employees.module.ts
│   │   │   ├── employees.controller.ts      # CRUD + updateRoles + toggleStatus + resendInvite
│   │   │   ├── employees.service.ts
│   │   │   └── dto/
│   │   │       ├── create-employee.dto.ts   # Matches AddEmployeePayload in frontend
│   │   │       └── update-roles.dto.ts      # Matches UpdateEmployeeRolesPayload
│   │   │
│   │   ├── audit-logs/                      # /api/audit-logs (SUPER_ADMIN)
│   │   │   ├── audit-logs.module.ts
│   │   │   ├── audit-logs.controller.ts     # findAll (paginated, filterable)
│   │   │   ├── audit-logs.service.ts
│   │   │   └── dto/query-audit.dto.ts
│   │   │
│   │   ├── customers/                       # /api/customers
│   │   │   ├── customers.controller.ts      # findAll, findOne, updateStatus
│   │   │   ├── customers.service.ts
│   │   │   └── services/
│   │   │       ├── booking-history.service.ts
│   │   │       └── transaction-history.service.ts
│   │   │
│   │   ├── companions/                      # /api/companions
│   │   │   ├── companions.controller.ts
│   │   │   ├── companions.service.ts
│   │   │   └── services/
│   │   │       ├── trust-score-history.service.ts
│   │   │       ├── session-history.service.ts
│   │   │       └── earnings-breakdown.service.ts
│   │   │
│   │   ├── companion-applications/          # Companion onboarding review
│   │   ├── verification/                    # KYC queue + threshold config
│   │   ├── trust-score/                     # Trust score engine rules
│   │   ├── moderation/
│   │   │   ├── reports.controller.ts        # Reports & Warnings
│   │   │   ├── bans.controller.ts           # Bans & Suspensions
│   │   │   ├── flagged-chats.controller.ts
│   │   │   ├── chat-settings.controller.ts
│   │   │   ├── risk-scoring.controller.ts
│   │   │   ├── reviews.controller.ts
│   │   │   └── appeals.controller.ts
│   │   ├── safety/
│   │   │   ├── sos.controller.ts + sos.gateway.ts
│   │   │   ├── incidents.controller.ts
│   │   │   ├── geofence.controller.ts
│   │   │   ├── age-escalation.controller.ts
│   │   │   ├── emergency-workflow.controller.ts
│   │   │   └── live-sessions.controller.ts
│   │   ├── bookings/
│   │   │   ├── active-sessions.controller.ts
│   │   │   ├── completed-bookings.controller.ts
│   │   │   ├── cancelled-bookings.controller.ts
│   │   │   ├── session-audit.controller.ts
│   │   │   ├── disputes.controller.ts
│   │   │   └── matchmaking.controller.ts
│   │   ├── operations/
│   │   │   ├── live-map.gateway.ts          # Socket.io: push location updates
│   │   │   ├── venues.controller.ts
│   │   │   └── city-launch.controller.ts
│   │   ├── financial/
│   │   │   ├── escrow.controller.ts
│   │   │   ├── payouts.controller.ts + payout-processor.job.ts
│   │   │   ├── refunds.controller.ts
│   │   │   ├── fraud-detection.controller.ts
│   │   │   ├── tax-invoices.controller.ts
│   │   │   ├── revenue-reports.controller.ts
│   │   │   └── reconciliation.controller.ts
│   │   ├── wallets/                         # Double-entry ledger (critical!)
│   │   │   ├── wallets.module.ts
│   │   │   └── ledger.service.ts            # PostTransaction -> DB transaction
│   │   ├── support/
│   │   │   ├── tickets.controller.ts        # Threaded messages, assign, escalate
│   │   │   ├── sla-dashboard.controller.ts
│   │   │   └── sla-escalation.job.ts
│   │   ├── discovery/
│   │   │   ├── ranking-config.controller.ts
│   │   │   └── events.controller.ts
│   │   ├── growth-abuse/                    # Fake account / promo abuse
│   │   ├── marketing/
│   │   │   ├── notifications.controller.ts
│   │   │   └── referrals.controller.ts
│   │   ├── legal/
│   │   │   ├── data-privacy.controller.ts   # DSAR workflow
│   │   │   └── legal-requests.controller.ts
│   │   ├── platform-config/
│   │   │   ├── policy-docs.controller.ts
│   │   │   └── training.controller.ts
│   │   ├── analytics/
│   │   │   ├── safety-analytics.controller.ts
│   │   │   ├── financial-analytics.controller.ts
│   │   │   ├── operational-analytics.controller.ts
│   │   │   └── growth-analytics.controller.ts
│   │   ├── system/
│   │   │   ├── config.controller.ts         # Commission, pricing
│   │   │   └── app-configs.controller.ts    # Dynamic app settings
│   │   └── master-data/                     # ALL CRUD for 18+ master tables
│   │       ├── master-data.module.ts
│   │       ├── controllers/
│   │       │   ├── cities.controller.ts
│   │       │   ├── interests.controller.ts
│   │       │   ├── languages.controller.ts
│   │       │   ├── ticket-categories.controller.ts
│   │       │   ├── incident-types.controller.ts
│   │       │   ├── review-tags.controller.ts
│   │       │   └── ... (all 18 master types)
│   │       └── master-data.service.ts
│   │
│   ├── sockets/
│   │   ├── socket.module.ts
│   │   ├── live-map.gateway.ts              # WebSocket channel: `map:location`
│   │   ├── sos.gateway.ts                   # Channel: `sos:alert`
│   │   ├── notifications.gateway.ts         # Channel: `staff:notifications`
│   │   └── adapters/
│   │       └── redis-io.adapter.ts          # Socket.io Redis adapter for multi-instance
│   │
│   └── jobs/
│       ├── jobs.module.ts
│       ├── payout-processor.job.ts          # BullMQ: process payout batches
│       ├── sla-escalation.job.ts            # Cron: every 5min, check SLA breach
│       ├── revenue-rollup.job.ts            # Cron: daily, aggregate financial stats
│       ├── stale-session.job.ts             # Cron: auto-end sessions past expectedEnd
│       └── processors/
│           └── email.processor.ts           # Send emails via queue
│
├── prisma/
│   ├── schema.prisma                        # ← All tables + indexes + enums
│   ├── migrations/                          # Prisma migrate dev -> create migration files
│   ├── seed.ts                              # Reference language only; administrator bootstrap is separate
│   └── seed-helpers.ts
│
├── test/
│   ├── app.e2e-spec.ts
│   ├── auth.e2e-spec.ts
│   ├── employees.e2e-spec.ts
│   └── fixtures/
│       └── test-data.json
│
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml                   # Postgres 16 + Redis 7 + NestJS app
│   └── pg-init.sql                          # Create DB, extensions (pgcrypto, uuid-ossp)
│
├── swagger/
│   └── export-openapi.ts                    # Script to write openapi.json to disk
│
├── .env.example
├── .env
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── eslint.config.mjs
├── package.json
└── README.md
```

---

## 5. Module Dependency Graph (Load Order)

```
1. PrismaModule
      ↓
2. ConfigModule (env-validated)
      ↓
3. AuthModule (depends on Prisma + Config)
      ↓
4. CommonModule (Guards, Interceptors depend on Auth + AuditLogs)
      ↓
5. EmployeesModule, AuditLogsModule, MasterDataModule
      ↓
6. CustomersModule, CompanionsModule, WalletsModule
      ↓
7. BookingsModule, VerificationModule, ModerationModule, SafetyModule
      ↓
8. FinancialModule, SupportModule, OperationsModule, DiscoveryModule
      ↓
9. LegalModule, MarketingModule, PlatformConfigModule, AnalyticsModule
      ↓
10. Sockets + Jobs (depend on all of the above)
```

**Critical Dependencies Never Skip:**
- `WalletsModule` must exist BEFORE `BookingsModule` (booking charges wallet)
- `AuditLogsModule` must exist BEFORE any write operations (auto-logging interceptor depends on it)
- `MasterDataModule` wire up FIRST per [README.md](file:///d:/CoBuddy-Admin/README.md) because every feature depends on Cities / Languages / Tags

---

## 6. Standard Response Envelope

All controllers must return this via `TransformInterceptor`:

```typescript
// GET /api/employees?page=1&limit=20 → 200 OK
{
  "success": true,
  "data": [
    { "id": "emp-1", "name": "Admin User", "email": "admin@cobuddy.com", "..." : "..." }
  ],
  "message": "Employees fetched successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}

// POST /api/auth/login → 200 OK (no pagination)
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "v1.G6...",
    "user": { "id": "emp-1", "name": "Admin User", "roles": ["SUPER_ADMIN"] }
  },
  "message": "Login successful"
}

// Validation error → 400 Bad Request
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" },
      { "field": "password", "message": "Must be at least 8 characters" }
    ]
  }
}

// 401 Unauthorized
{
  "success": false,
  "error": { "code": "UNAUTHORIZED", "message": "Invalid or expired token" }
}

// 403 Forbidden (missing role)
{
  "success": false,
  "error": { "code": "FORBIDDEN", "message": "You do not have permission to access this resource" }
}

// 404 Not Found
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Employee with id XYZ not found" }
}

// 429 Too Many Requests
{
  "success": false,
  "error": { "code": "RATE_LIMITED", "message": "Too many requests. Try again in 30 seconds" }
}
```

### Paginated Query Standard

Accept query string in ALL list endpoints:

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | `1` | 1-indexed page |
| `limit` | int | `20` | Max 100, enforced |
| `sortBy` | string | `createdAt` | Field to sort (validate against allow-list) |
| `sortOrder` | `asc`\|`desc` | `desc` | Sort direction |
| `search` | string | `''` | Keyword search (name/email/subject - case insensitive) |
| `filters[field]` | any | - | Field-specific equality (e.g. `?filters[status]=ACTIVE`) |
| `dateFrom` | ISO date | - | `createdAt >= dateFrom` |
| `dateTo` | ISO date | - | `createdAt <= dateTo` |

---

## 7. Error Code Catalogue (Standardized)

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Zod validation failed → check `details[]` |
| `UNAUTHORIZED` | 401 | No token / expired token / bad credentials |
| `TWO_FACTOR_REQUIRED` | 403 | Login step 1 OK, need OTP (frontend transitions to 2FA screen) |
| `FORBIDDEN` | 403 | Missing required role |
| `CITY_SCOPE_VIOLATION` | 403 | CITY_OPS_MANAGER tried to touch another city's data |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Duplicate unique value (email, phone, employeeId) |
| `RATE_LIMITED` | 429 | Too many requests |
| `PAYMENT_FAILED` | 402 | Wallet low, payout failed, etc. |
| `FINANCIAL_INTEGRITY_ERROR` | 500 | Ledger mismatch → Ops team MUST investigate |
| `INTERNAL_ERROR` | 500 | Unexpected server error (all caught → Sentry) |

---

## 8. Authentication Flow (Matching Frontend)

Frontend login is **2-step**. See [login/page.tsx](file:///d:/CoBuddy-Admin/src/app/login/page.tsx).

### Step 1 - POST /api/auth/login
**Body:**
```json
{ "email": "admin@cobuddy.com", "password": "correct horse battery" }
```

**Responses:**
- `401` → bad credentials (frontend shows "Invalid email or password")
- `403` code=`ACCOUNT_SUSPENDED` → frontend shows suspended msg
- `200` code=`TWO_FACTOR_REQUIRED` → set pending user session, return `mfaToken` (short-lived JWT), frontend shows 2FA input
- `200` code=`OK` → 2FA disabled, return full tokens

### Step 2 - POST /api/auth/verify-2fa
**Body:**
```json
{ "mfaToken": "step1-jwt", "otp": "123456" }
```
**Response:** return `{ accessToken, refreshToken, user }`

### Token Storage on Frontend
- `accessToken` → `localStorage.admin_token` (axios picks it up, see [client.ts](file:///d:/CoBuddy-Admin/src/lib/api/client.ts))
- `refreshToken` → `localStorage.admin_refresh` (DO NOT put in localStorage in production → use HttpOnly cookie)

### Refresh Flow
- When interceptor sees `401`, call `POST /api/auth/refresh { refreshToken }`
- Return new `accessToken`. Retry original request transparently.
- If refresh fails → clear storage, redirect `/login`

---

## 9. Next Steps

Proceed to:
1. **[02-DATABASE-SCHEMA.md](./02-DATABASE-SCHEMA.md)** - Full Prisma schema
2. **[03-API-ENDPOINTS.md](./03-API-ENDPOINTS.md)** - Complete endpoint list
3. **[04-SECURITY.md](./04-SECURITY.md)** - Security hardening checklist
4. **[05-FRONTEND-INTEGRATION.md](./05-FRONTEND-INTEGRATION.md)** - Wire frontend to real backend
5. **[06-ROADMAP.md](./06-ROADMAP.md)** - Week-by-week execution plan
