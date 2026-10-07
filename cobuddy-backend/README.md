# CoBuddy Admin — Backend

NestJS + Prisma + PostgreSQL + Redis admin backend for CoBuddy companion booking platform.

Current release scope and acceptance evidence: [Handover report](../HANDOVER_READINESS_REPORT.md).
The old demo seed has been removed; existing database records are not automatically deleted.

---

## ⚡ Quick Start (5 min mein chalu karo)

### Step 1 — Prerequisites

| Tool | Version Required |
|---|---|
| [Node.js](https://nodejs.org/) | 24 |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Latest |
| [pnpm](https://pnpm.io/) / npm | Built-in npm works fine |

### Step 2 — Docker containers (PostgreSQL + Redis) start karo

```bash
cd cobuddy-backend
npm run docker:up
```

Wait 30 seconds till containers become healthy. Verify:

```bash
docker ps
# Expected: cobuddy-postgres (5432), cobuddy-redis (6379) — both Up (healthy)
```

### Step 3 — Node dependencies install karo

```bash
cd cobuddy-backend
npm ci
```

### Step 4 — Prisma setup (Generate client + DB schema + Seed data)

```bash
npm run prisma:generate        # 1. TypeScript client generate
npm run prisma:migrate-deploy  # 2. Apply committed migrations
npm run db:seed                # 3. English reference language only; no demo accounts
```

### Step 5 — Backend dev server chalao

```bash
npm run start:dev
```

✅ Server will start on: **http://localhost:4000/api**
✅ Swagger Docs: **http://localhost:4000/swagger**

---

## 📋 All Commands Reference

### 🐳 Docker Commands

| Command | Description |
|---|---|
| `npm run docker:up` | PostgreSQL + Redis containers start (background) |
| `npm run docker:down` | Sab containers stop + remove |
| `docker compose -f docker/docker-compose.yml ps` | Container status check |
| `docker compose -f docker/docker-compose.yml logs -f postgres` | PostgreSQL logs dekho |
| `docker compose -f docker/docker-compose.yml logs -f redis` | Redis logs dekho |

### 🗄️ Database (Prisma) Commands

| Command | Purpose |
|---|---|
| `npm run prisma:generate` | Prisma TypeScript client regenerate (schema.prisma change ke baad) |
| `npx prisma db push` | Schema ko direct DB mein sync (dev mode — no migration files) |
| `npm run prisma:migrate-dev` | Migration file create + apply (`migrations/` mein store) |
| `npm run prisma:migrate-deploy` | Production mein saved migrations apply |
| `npm run db:seed` | Initialize essential reference data, without demo people or transactions |
| `npm run db:inventory-demo` | Read-only inventory of legacy seed candidates |
| `npm run prisma:studio` | Browser mein Prisma Studio (DB visual GUI) — http://localhost:5555 |

### ▶️ Server / Build Commands

| Command | Description |
|---|---|
| `npm run start:dev` | **Watch mode dev server** (file change pe auto-reload) |
| `npm run start` | Normal NestJS start (no watch) |
| `npm run start:debug` | Dev server with `--inspect` debug port |
| `npm run build` | Production build (`dist/` folder mein compile) |
| `npm run start:prod` | Production build se server chalao |

### 🔍 Quality Commands

| Command | Purpose |
|---|---|
| `npx tsc --noEmit` | TypeScript type errors check (no output files) |
| `npm run lint` | ESLint run + auto-fix |
| `npm run format` | Prettier se sab files format |
| `npm run test` | Jest unit tests run |
| `npm run test:cov` | Jest with code coverage report |
| `npm run test:e2e` | End-to-end tests run |

---

## 🌱 Default Seed Login Credentials

**Default password** sab demo accounts ke liye: `CoBuddy@2026`

Admin account ka password reset karne ke liye backend folder mein `ADMIN_LOGIN_PASSWORD` environment variable set karke `npm run admin:reset-password` chalao. Isse sirf `admin@cobuddy.com` ka password hash update hota hai; demo seed dobara chalane ki zaroorat nahi.

## 🔑 Forgot password

The login page includes a **Forgot password?** link. It sends a one-time reset link that expires after one hour and invalidates all existing sessions after the password changes.

Set `RESEND_API_KEY`, `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDR`, and `FRONTEND_URL` in `.env` to deliver reset emails. During local development without `RESEND_API_KEY`, the backend prints the reset URL only in its terminal so the flow can be tested without sending an email.

Seed data mein yeh entries hoti hain:
- Super Admin, Staff Employees (Operations, Finance, Moderation roles)
- 10 Cities (Mumbai, Delhi, Bangalore, Pune, Hyderabad, etc.)
- 13+ Interests, 15 Languages, 20+ Cancellation/Dispute Reasons
- Categories, Review Tags, KYC Document Types, etc.

---

## 🚏 API Endpoints (Quick Reference)

Base URL: `http://localhost:4000/api`

| Module | Routes |
|---|---|
| 🔓 Public | `GET /` — Welcome · `GET /health` — Live health check |
| 🔐 Auth | `/api/auth/*` — Login / 2FA / Refresh / Logout |
| 🧑‍💼 Employees | `/api/employees/*` |
| 👥 Customers | `/api/customers/*` |
| 💼 Companions | `/api/companions/*` |
| 📝 Companion Applications | `/api/companion-applications/*` |
| 👛 Wallets | `/api/wallets/*` · `/api/wallets/ledger` |
| 💰 Bookings | `/api/bookings/*` |
| 🧾 Financial · Payouts | `/api/financial/payouts/*` |
| 💰 Financial · Refunds | `/api/financial/refunds/*` |
| 🚨 Financial · Fraud | `/api/financial/fraud-flags/*` |
| 📑 Financial · Invoices | `/api/financial/tax-invoices/*` |
| 📊 Financial · Reports | `/api/financial/revenue-reports/*` |
| ⚖️ Financial · Reconciliation | `/api/financial/reconciliation/*` |
| 🪖 Moderation | `/api/moderation/reports` · `bans` · `reviews` · `appeals` · `chat-settings` · `risk-scores` · `flagged-chats` |
| 🛡️ Trust Score | `/api/trust-score/*` |
| ✅ Verification KYC | `/api/verification/cases/*` · `/api/verification/thresholds` |
| 📚 Master Data Bundle | `GET /api/master-data/bundle` — Saara master data ek hi req mein |
| 🔧 System | `/api/system/configs` · `/api/system/app-configs` |
| 📜 Audit Logs | `/api/audit-logs/*` |

Health check:
```bash
curl http://localhost:4000/api/health
# Expected: {"success":true,"data":{"status":"ok","services":{"postgres":"connected"}}}
```

---

## ⚙️ Environment Variables

File: `cobuddy-backend/.env`

| Variable | Default Value | Notes |
|---|---|---|
| `NODE_ENV` | `development` | `production` / `staging` bhi ho sakta |
| `PORT` | `4000` | Backend HTTP port |
| `DATABASE_URL` | `postgresql://cobuddy:cobuddy@localhost:5432/cobuddy` | Prisma DB URL |
| `DIRECT_URL` | same as DATABASE_URL | Prisma migrate deploy ke liye |
| `REDIS_URL` | `redis://:cobuddy-redis-pw@localhost:6379/0` | Throttler + queue storage |
| `JWT_ACCESS_SECRET` | `cobuddy-dev-access-secret-min-32-chars` | ⚠️ Production mein change karo |
| `JWT_REFRESH_SECRET` | `cobuddy-dev-refresh-secret-min-32-chars` | ⚠️ Production mein change karo |
| `JWT_MFA_SECRET` | `cobuddy-dev-mfa-secret-min-32-characters` | ⚠️ Production mein change karo |
| `JWT_ACCESS_TTL` | `15m` | Access token expiry |
| `JWT_REFRESH_TTL` | `7d` | Refresh token expiry |
| `BCRYPT_SALT_ROUNDS` | `12` | Password hash cost factor |
| `ENCRYPTION_KEY_PII` | 64 char hex key | ⚠️ PII fields ke liye — production mein random generate |
| `CORS_ORIGIN` | `http://localhost:3000` | Frontend URL (comma-separated multiple) |
| `FRONTEND_URL` | `http://localhost:3000` | Invite/reset email links ke liye |

---

## 🗄️ PostgreSQL Connection (Database Client mein set karo)

Agar aap DBeaver / TablePlus / pgAdmin use karte ho:

| Field | Value |
|---|---|
| Host | `127.0.0.1` / `localhost` |
| Port | `5432` |
| Username | `cobuddy` |
| Password | `cobuddy` |
| Database | `cobuddy` |

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11.2.7 (Express 5.2.1 platform) |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7 (BullMQ, throttler) |
| Validation | class-validator + class-transformer (global pipes) |
| Auth | JWT (Access + Refresh + 2FA via otplib/qrcode) |
| API Docs | Swagger / OpenAPI 3 (`@nestjs/swagger`) |
| Security | Helmet, Throttler (rate limits), CORS, cookie-parser |
| Email | Resend SDK (placeholder — configure API key in env) |
| Storage | AWS S3 v3 SDK (companion docs, KYC uploads) |
| Linting | ESLint + typescript-eslint |
| Formatting | Prettier |

---

## 📁 Project Structure

```
cobuddy-backend/
├── docker/
│   ├── docker-compose.yml        # Postgres 16 + Redis 7
│   ├── pg-init.sql               # DB init script
│   └── data/                     # Mounted volumes (git-ignored)
├── prisma/
│   ├── schema.prisma             # ✅ Single source of truth — data model
│   ├── migrations/               # Prisma migration files
│   └── seed.ts                   # Reference data only (npm run db:seed)
├── src/
│   ├── main.ts                   # Bootstrap: CORS, Helmet, global prefix, pipes, Swagger
│   ├── app.module.ts             # Root module (sab submodules yahin register)
│   ├── prisma/
│   │   ├── prisma.module.ts      # PrismaService DI module
│   │   └── prisma.service.ts     # extends PrismaClient + $on hooks
│   ├── common/
│   │   ├── decorators/           # @Public(), @AllowModule(), @Roles(), @CurrentUser()
│   │   ├── guards/               # JwtAuthGuard, RolesGuard, CityScopeGuard
│   │   ├── interceptors/         # TransformInterceptor (meta pagination), AuditLogInterceptor
│   │   ├── filters/              # AllExceptionsFilter (standard error shape)
│   │   ├── dto/                  # Pagination, shared DTOs
│   │   └── lib/                  # date-util, error codes, etc.
│   ├── config/                   # Env validation (Zod)
│   └── modules/
│       ├── auth/                 # Login, 2FA, refresh token, password reset
│       ├── employees/            # Staff employees CRUD + roles + invites
│       ├── customers/            # Customer CRUD + tickets + reports + wallet adjust
│       ├── companions/           # Companion CRUD + profile + status
│       ├── companion-applications/  # Onboarding application workflow
│       ├── wallets/              # Wallets + wallet transaction ledger
│       ├── bookings/             # Bookings, disputes, reviews
│       ├── financial/
│       │   ├── payouts/          # Companion payouts
│       │   ├── refunds/          # Customer refunds
│       │   ├── fraud-detection/  # Fraud flags dashboard
│       │   ├── tax-invoices/     # Invoicing
│       │   ├── revenue-reports/  # Revenue summary + charts data
│       │   └── reconciliation/   # Gateway vs internal txn matching
│       ├── moderation/           # Reports, bans, reviews, appeals, chat settings, risk
│       ├── trust-score/          # Companion trust score rules
│       ├── verification/         # KYC cases + thresholds + auto-check
│       ├── master-data/          # Cities, interests, languages, bundle endpoint
│       ├── system/               # App configs, root /api welcome, /health
│       └── audit-logs/           # Audit log read endpoint
├── .env                          # Dev env vars (committed for setup ease)
├── eslint.config.mjs             # Backend ESLint (TS rules only, NO React/Next rules)
├── tsconfig.json                 # TypeScript strict mode + @/* alias -> src/*
├── package.json                  # Sab script IDs yahin
└── README.md                     # You are here!
```

---

## 🚑 Troubleshooting

### ❌ "Cannot connect to database" / Connection Refused

Check:
```bash
docker ps   # cobuddy-postgres UP (healthy) dikhna chahiye
```
Nahi hai toh: `npm run docker:up` — wait 30 sec, phir check karo.

### ❌ Prisma Error: "table does not exist"

Schema push karo phir se:
```bash
npx prisma db push
```

### ❌ Ports 5432 / 6379 already in use

Windows pe existing service stop karo:
```powershell
# PostgreSQL Windows service (if installed)
Stop-Service -Name postgresql-x64-* -Force
# Redis Windows service
Stop-Service -Name Redis -Force
```
Ya phir `docker/docker-compose.yml` mein host ports change karo (e.g. `55432:5432`).

### ❌ Backend start par "module not found"

Reinstall deps + regenerate Prisma:
```bash
rm -rf node_modules package-lock.json    # Windows: del /s /q node_modules package-lock.json
npm install
npm run prisma:generate
npm run start:dev
```

### ❌ Auth token har 15 min mein expire ho jata

Default `JWT_ACCESS_TTL=15m` hai. `.env` mein badlo: `JWT_ACCESS_TTL=24h`

### ❌ VS Code mein backend files par red errors

Root `eslint.config.mjs` Next.js config hai — wo backend apply nahi hota. Agar phir bhi errors dikhen:
1. `Ctrl+Shift+P` → **ESLint: Restart ESLint Server**
2. Ya IDE restart karo

---

## 📌 Production Checklist (Deploy se pehle)

1. **Secrets rotate karo**: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_MFA_SECRET`, `ENCRYPTION_KEY_PII`, `POSTGRES_PASSWORD`, Redis password — sabko 32+ chars crypto-random rakho.
2. `NODE_ENV=production` set karo.
3. DB migrations use karo (**not** `db push`):
   ```bash
   npm run prisma:migrate-deploy
   ```
4. `dist/` se `npm run start:prod` chalao (not start:dev).
5. HTTPS + reverse proxy (Nginx / Caddy) daalo, CORS_ORIGIN actual frontend domain set karo.
6. Postgres volume backup enable karo.

---

Happy coding! 🚀
