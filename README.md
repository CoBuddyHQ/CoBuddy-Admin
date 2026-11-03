# CoBuddy Admin Operations Platform — Next.js & NestJS Monorepo

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![NestJS Version](https://img.shields.io/badge/NestJS-11.0.0-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-7.9.1-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Proprietary-blue.svg?style=flat-square)](LICENSE)

The **CoBuddy Admin Platform** is the centralized mission-control portal and internal operations server for the CoBuddy ecosystem. Hosted as a unified monorepo, it contains both the **Next.js Web Frontend** (Operations Dashboard) and the **NestJS Operations Backend**. The platform provides full administrative control over user verification, companion applications, emergency SOS safety monitoring, content moderation, financial reconciliations, master data management, and automated S2S synchronization across all microservices.

---

## Table of Contents

- [1. Monorepo Architecture & Cross-Service Topology](#1-monorepo-architecture--cross-service-topology)
- [2. Administrative Domains & Capabilities](#2-administrative-domains--capabilities)
- [3. Deep Technical System Design](#3-deep-technical-system-design)
  - [3.1 KYC Verification Queue & Decision Engine](#31-kyc-verification-queue--decision-engine)
  - [3.2 Server-to-Server (S2S) Internal Sync Protocol](#32-server-to-server-s2s-internal-sync-protocol)
  - [3.3 Role-Based Access Control (RBAC) & Staff Security](#33-role-based-access-control-rbac--staff-security)
  - [3.4 Master Data Bundle Distribution](#34-master-data-bundle-distribution)
- [4. Monorepo Layout & Directory Structure](#4-monorepo-layout--directory-structure)
- [5. Complete Admin API Reference](#5-complete-admin-api-reference)
- [6. Database Schema & Prisma Models](#6-database-schema--prisma-models)
- [7. Environment Configuration Matrix](#7-environment-configuration-matrix)
- [8. Local Setup & Docker Deployment](#8-local-setup--docker-deployment)
- [9. Testing & Quality Assurance](#9-testing--quality-assurance)

---

## 1. Monorepo Architecture & Cross-Service Topology

The Admin platform sits at the apex of the CoBuddy distributed system, aggregating live data from the Customer and Companion backends:

```mermaid
flowchart TD
    subgraph Browser["Operator Browser"]
        Staff["Operations & Compliance Staff"]
    end

    subgraph Frontend["Admin Frontend (Port 3000 / 43100)"]
        NextUI["Next.js 14 App Router (React 18 + Tailwind)"]
        AuthStore["Zustand Auth & Permission Store"]
        QueryClient["TanStack React Query Cache"]
    end

    subgraph Backend["Admin Backend (Port 4000 / 4400)"]
        APIGW["NestJS Gateway & AuthGuards"]
        SyncM["InternalSyncService (S2S Hub)"]
        KycM["VerificationService (Approve / Reject)"]
        SafetyM["SafetyOps & SOS Monitor"]
        FinanceM["Payout & Refund Ledger"]
        MasterM["MasterData Management"]
        PrismaA["Prisma ORM 7.x"]
    end

    subgraph Database["Admin Storage Layer"]
        ADB[("PostgreSQL 16<br/>cobuddy_admin")]
        ARedis[("Redis 7<br/>Session Cache")]
    end

    subgraph ExternalServices["Downstream Microservices"]
        CustBE["Customer Backend (Port 4002 / 4402)"]
        CompBE["Companion Backend (Port 4001 / 4401)"]
    end

    Staff --> NextUI
    NextUI --> AuthStore
    NextUI --> QueryClient
    QueryClient -->|REST API / HTTPS| APIGW

    APIGW --> SyncM
    APIGW --> KycM
    APIGW --> SafetyM
    APIGW --> FinanceM
    APIGW --> MasterM

    SyncM & KycM & SafetyM & FinanceM & MasterM --> PrismaA
    PrismaA --> ADB
    APIGW --> ARedis

    CustBE -->|POST /api/internal/verification/cases/sync| SyncM
    CompBE -->|POST /api/internal/companion-applications/sync| SyncM
    KycM -->|POST /api/v1/internal/verification-status| CustBE
    KycM -->|POST /api/v1/internal/application-status| CompBE
```

---

## 2. Administrative Domains & Capabilities

* **Verification & Trust**: Centralized KYC queue displaying submitted Aadhaar, PAN, DL, and Passport documents with selfie face comparisons. Provides one-click *Approve* and *Reject* actions with automated downstream S2S notification.
* **Companion Applications**: Full funnel tracking for companion applicants (submitted $\rightarrow$ under review $\rightarrow$ interview scheduled $\rightarrow$ approved/rejected).
* **Live SOS & Safety Operations**: Real-time map dashboard monitoring active emergency alerts, user GPS telemetry, and incident escalation notes.
* **Content & User Moderation**: Queue for user reports, chat room message inspections, review moderation, and account suspension / ban appeals.
* **Finance & Payouts**: Manual review and approval of companion withdrawal requests, platform commission reconciliation, and tax invoice generation.
* **Master Data Management**: Centralized configuration of active cities, operational areas, interest categories, spoken languages, ticket categories, incident types, and dispute reasons.
* **Promotions & Campaigns**: Authoring and publishing dynamic in-app announcements, promotional discounts, and city-targeted campaigns.

---

## 3. Deep Technical System Design

### 3.1 KYC Verification Queue & Decision Engine

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer App
    participant CustBE as Customer Backend
    participant AdminBE as Admin Backend
    actor Operator as Compliance Operator
    participant AdminFE as Admin Frontend

    Customer->>CustBE: POST /kyc/document & /kyc/selfie
    CustBE->>AdminBE: POST /api/internal/verification/cases/sync (S2S)
    AdminBE->>AdminBE: Upsert VerificationCase (PENDING_MANUAL_REVIEW)
    Operator->>AdminFE: Navigate to /verification
    AdminFE->>AdminBE: GET /api/verification/cases?status=PENDING_MANUAL_REVIEW
    AdminBE-->>AdminFE: Return Pending KYC Cases
    Operator->>AdminFE: Inspect Documents & Click "Approve"
    AdminFE->>AdminBE: POST /api/verification/cases/:id/decision (APPROVED)
    AdminBE->>AdminBE: Update VerificationCase (APPROVED) & Customer (VERIFIED)
    AdminBE->>CustBE: POST /api/v1/internal/verification-status (status: approved)
    CustBE->>CustBE: Update Customer.kycStatus = 'verified'
    CustBE-->>Customer: Profile Updates to Verified (Green Checkmark)
```

### 3.2 Server-to-Server (S2S) Internal Sync Protocol

The Admin backend acts as the authoritative sink for multi-service entities. All S2S endpoints are housed in `InternalSyncController`:
* **Security Guard**: Incoming requests must pass the `InternalServiceGuard`, which validates `X-Internal-Service-Key` against `INTERNAL_SERVICE_SECRET`.
* **Idempotent Upserts**: Entity sync operations use composite unique keys or case references (e.g., `VC-CUSTOMER-<id>`) to safely tolerate duplicate webhook retries without creating orphan records.
* **Auditing**: Every synchronized case records an immutable event entry in `VerificationAuditEvent` or `AuditLog`.

### 3.3 Role-Based Access Control (RBAC) & Staff Security

The system implements 9 discrete staff roles with granular permission policies:
* `SUPER_ADMIN`: Unrestricted platform access, staff provisioning, and system configuration.
* `SAFETY_OPERATOR`: Access to SOS dashboard, geofence alerts, and incident escalation.
* `SUPPORT_AGENT` & `SUPPORT_LEAD`: Access to support tickets and user communication.
* `MODERATOR`: Access to user reports, review moderation, and bans.
* `FINANCE_ADMIN`: Access to payouts, transactions, and tax invoices.
* `CITY_OPS_MANAGER`: Scoped access to city launches and venue management.
* `LEGAL_ADMIN` & `HR_ADMIN`: Access to compliance policies and staff onboarding.

### 3.4 Master Data Bundle Distribution

Admin exposes a unified endpoint `/api/internal/master-data/bundle` that packages active cities, areas, interests, spoken languages, and system defaults. Downstream services consume this bundle during startup caching to ensure cross-service terminology alignment.

---

## 4. Monorepo Layout & Directory Structure

```text
CoBuddy-Admin/
├── cobuddy-frontend/              # Next.js 14 Operations Web Portal
│   ├── src/
│   │   ├── app/                   # App Router pages ((dashboard), login, etc.)
│   │   │   ├── (dashboard)/
│   │   │   │   ├── verification/  # Verification Queue & Settings
│   │   │   │   ├── companions/    # Companion applications & directory
│   │   │   │   ├── customers/     # Customer management & bans
│   │   │   │   ├── safety/        # Live SOS & Geofence alerts
│   │   │   │   ├── moderation/    # Reports, chats, reviews
│   │   │   │   ├── finance/       # Payouts, refunds, invoices
│   │   │   │   └── system/        # Master data management & audits
│   │   │   └── login/             # Staff authentication
│   │   ├── components/            # UI library (Table, Modal, Badge, Sidebar)
│   │   ├── lib/                   # Axios client & permission helpers
│   │   ├── modules/               # Domain-specific React Query hooks & views
│   │   └── store/                 # Zustand stores (authStore, uiStore)
│   ├── package.json               # Frontend dependencies
│   └── tsconfig.json              # TypeScript configuration
├── cobuddy-backend/               # NestJS Operations Server
│   ├── prisma/
│   │   ├── schema.prisma          # 73 relational models
│   │   └── seed.ts                # Bootstrap super admin seeds
│   ├── src/
│   │   ├── common/                # Guards, interceptors, filters
│   │   ├── modules/
│   │   │   ├── auth/              # Staff login, 2FA, password resets
│   │   │   ├── verification/      # Verification case decisions & audit
│   │   │   ├── companions/        # Application vetting & interviews
│   │   │   ├── customers/         # Customer profiles & bans
│   │   │   ├── internal-sync/     # S2S receiver for Bookings, KYC, SOS
│   │   │   ├── safety/            # Real-time SOS alerts & geofencing
│   │   │   ├── finance/           # Payout approvals & reconciliations
│   │   │   ├── marketing/         # Announcements & campaigns
│   │   │   ├── master-data/       # Dynamic master data catalogs
│   │   │   └── employees/         # Staff directory & RBAC
│   │   ├── app.module.ts          # Root backend module
│   │   └── main.ts                # Backend bootstrap
│   ├── package.json               # Backend dependencies
│   └── tsconfig.json              # Backend TypeScript settings
├── docker-compose.yml             # Orchestration for Admin DB, Redis, FE, BE
├── package.json                   # Root workspace scripts
└── README.md                      # This documentation
```

---

## 5. Complete Admin API Reference

All backend routes are prefixed with `/api`.

### 5.1 Staff Auth (`/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | Staff email/password authentication |
| `POST` | `/auth/verify-2fa` | Public | Validates 2FA TOTP code |
| `POST` | `/auth/refresh` | Public | Refreshes staff session access token |
| `POST` | `/auth/logout` | Authenticated | Terminates staff session |

### 5.2 Verification Queue (`/verification`)
| Method | Endpoint | Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/verification/cases` | `verification` | Lists pending and reviewed KYC cases |
| `GET` | `/verification/cases/:id` | `verification` | Fetches full document preview dossier |
| `POST` | `/verification/cases/:id/decision` | `verification` | Approves or rejects applicant KYC |
| `GET` | `/verification/thresholds` | `verification` | Automation score thresholds |

### 5.3 Internal S2S Sync Hub (`/internal`)
*Protected by `X-Internal-Service-Key`.*
| Method | Endpoint | Source | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/internal/verification/cases/sync` | Customer / Companion | Ingests new KYC dossier for review |
| `POST` | `/internal/companion-applications/sync`| Companion | Ingests companion onboarding application |
| `POST` | `/internal/bookings/sync` | Customer / Companion | Synchronizes booking lifecycle records |
| `POST` | `/internal/sos/sync` | Customer / Companion | Real-time dispatch of emergency SOS alerts |
| `GET` | `/internal/master-data/bundle` | Customer / Companion | Distributes active platform master data |

---

## 6. Database Schema & Prisma Models

The Admin database contains **73 relational tables** covering enterprise operations:

* **Identity & Verification**: `StaffEmployee`, `StaffSession`, `VerificationCase`, `VerificationAuditEvent`, `VerificationThreshold`.
* **Mirrors**: `Customer`, `Companion`, `CompanionApplication`, `Booking`, `Review`.
* **Safety & Security**: `SOSAlert`, `SafetyIncident`, `GeofenceZone`, `GeofenceAlertEvent`, `UserBan`, `UserBanAppeal`.
* **Finance**: `Payout`, `Refund`, `TaxInvoice`, `ReconciliationRecord`, `Wallet`, `WalletTransaction`.
* **Master Data**: `City`, `Area`, `Interest`, `SpokenLanguage`, `AppLanguage`, `TicketCategory`, `IncidentType`, `DisputeReason`, `CancellationReason`, `PlaceTypeConfig`, `SessionDurationOption`.

---

## 7. Environment Configuration Matrix

### Backend Configuration (`cobuddy-backend/.env`)
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://cobuddy:local-audit-placeholder-not-a-secret-20261018@localhost:45430/cobuddy_admin?schema=public
REDIS_HOST=localhost
REDIS_PORT=46370
JWT_SECRET=local-admin-jwt-secret-min-32-chars
INTERNAL_SERVICE_SECRET=local-audit-placeholder-not-a-secret-20261018
CUSTOMER_API_URL=http://localhost:4402
COMPANION_API_URL=http://localhost:4401
```

### Frontend Configuration (`cobuddy-frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4400/api
PORT=3000
```

---

## 8. Local Setup & Docker Deployment

### Native Setup

1. **Start Backend**:
   ```bash
   cd cobuddy-backend
   npm install
   npx prisma migrate dev
   npm run start:dev
   ```

2. **Start Frontend**:
   ```bash
   cd ../cobuddy-frontend
   npm install
   npm run dev
   ```
   Access the dashboard at `http://localhost:3000`.

### Docker Orchestration
```bash
docker compose up -d cobuddy-audit-performance-admin-backend-1 cobuddy-audit-performance-admin-frontend-1
```
* **Admin Frontend**: `http://localhost:43100` (or `http://localhost:3100`)
* **Admin Backend API**: `http://localhost:4400/api`
* **Swagger API Docs**: `http://localhost:4400/api/docs`

---

## 9. Testing & Quality Assurance

```bash
# Run backend tests (490 tests passing)
cd cobuddy-backend && npm test

# Run frontend unit tests
cd ../cobuddy-frontend && npm test
```
* **Current Status**: **490 / 490 Admin backend tests passing (100%)**, **0 TypeScript errors**.
