# CoBuddy Platform — Current Architecture Map & System Topology

**Document Version:** 1.0.0-PROD  
**Status:** Verified Against Active Source Code & Live Runtime  
**Date:** October 2026  
**Auditor:** Lead Architect & DevSecOps Engineer

---

## 1. Executive Architecture Overview

CoBuddy is an on-demand companionship and social activities platform designed with a multi-tier, decoupled microservice and modular monolith ecosystem. It connects Customers (seeking verified social companions) with Companions (screened individuals offering hourly social companionship), backed by a centralized Operational Administration and Trust & Safety platform.

### High-Level Topology Diagram

```mermaid
graph TD
    subgraph Client Tier
        CA[Customer Mobile App\nReact Native / TypeScript\nRepo: CobuddyCustomerIntegration]
        CP[Companion Mobile App\nReact Native / TypeScript\nRepo: CoBuddyCompanion]
        AF[Admin Web Portal\nNext.js / TypeScript\nRepo: CoBuddy-Admin/cobuddy-frontend]
    end

    subgraph Edge & Ingress
        CUST_GW[Customer API Gateway\nPort: 4002 / HTTPS]
        COMP_GW[Companion API Gateway\nPort: 4001 / HTTPS]
        ADMIN_GW[Admin API Gateway\nPort: 4000 / HTTPS]
    end

    subgraph Backend Services
        CB[Customer Backend\nNestJS / Prisma 7\nRepo: CobuddyCustomerBackend]
        PB[Companion Backend\nNestJS / Prisma 7 / pg-adapter\nRepo: CoBuddyCompanionBackend]
        AB[Admin Backend\nNestJS / Prisma 7\nRepo: CoBuddy-Admin/cobuddy-backend]
    end

    subgraph Service-to-Service S2S Mesh
        S2S_TOKEN[Mutual S2S Header\nx-internal-token: [REDACTED_SECRET]\nInternalServiceGuard]
    end

    subgraph Data Stores
        DB_CUST[(Customer DB\nAzure PostgreSQL\nSchema: public)]
        DB_COMP[(Companion DB\nPostgreSQL\nSchema: public)]
        DB_ADMIN[(Admin DB\nPostgreSQL\nSchema: public)]
        REDIS[(Redis Cache / BullMQ\nOptional / Production)]
    end

    subgraph External Integrations
        RP[Razorpay Gateway\nOrders, Payments, Webhooks]
        FCM[Firebase Cloud Messaging\nPush Notifications]
        SMS[Twilio / Fast2SMS\nOTP Delivery Provider]
        STORAGE[AWS S3 / Azure Blob\nEncrypted KYC & Media]
    end

    CA -->|REST / JWT Bearer| CUST_GW --> CB
    CP -->|REST / JWT Bearer| COMP_GW --> PB
    AF -->|REST / HttpOnly Cookie / Bearer| ADMIN_GW --> AB

    CB -.->|S2S POST /api/v1/internal/companion/requests| PB
    PB -.->|S2S POST /api/v1/internal/bookings/:id/status-update| CB
    CB -.->|Public Proxy GET /api/v1/companions/public| PB
    AB -.->|Admin Moderation / Sync| PB
    AB -.->|Admin Audit / Sync| CB

    CB --> DB_CUST
    PB --> DB_COMP
    AB --> DB_ADMIN

    CB --> RP
    PB --> FCM
    CB --> SMS
    PB --> STORAGE
    AB --> STORAGE
```

---

## 2. Core Service Boundaries & Data Ownership

| Service / App | Repository | Primary Role & Responsibility | Port / Base URL | Data Store Owner |
|---|---|---|---|---|
| **Customer Backend** | `CobuddyCustomerBackend` | Customer authentication, profile management, companion discovery proxy, booking creation, pricing computation, wallet operations, customer reviews, support tickets. | Port `4002`<br>`http://localhost:4002` | Azure Postgres (`cobuddy-pg-dev-avinash`) / Customer Schema |
| **Companion Backend** | `CoBuddyCompanionBackend` | Companion onboarding, KYC submissions, availability scheduling, session tracking, pass code arrival verification, earnings ledger, payout requests. | Port `4001`<br>`http://localhost:4001` | Docker Postgres (`cobuddy_companion`) / Companion Schema |
| **Admin Backend** | `CoBuddy-Admin/cobuddy-backend` | Staff authentication, RBAC, city-scoping, companion application verification, user moderation, dispute resolution, financial payouts, campaigns/announcements, safety SOS dispatch. | Port `4000`<br>`http://localhost:4000` | Docker Postgres (`cobuddy_admin`) / Admin Schema |
| **Admin Frontend** | `CoBuddy-Admin/cobuddy-frontend` | Next.js operational dashboard for ops managers, trust & safety agents, finance team, and superadmins. | Port `3000`<br>`http://localhost:3000` | Stateless (consumes Admin Backend) |
| **Customer Mobile App** | `CobuddyCustomerIntegration` | React Native iOS/Android app for end customers to browse companions, book activities, pay via Razorpay, track live session. | Native Mobile Bundle | Local storage / SecureStore (Stateless) |
| **Companion Mobile App** | `CoBuddyCompanion` | React Native iOS/Android app for companions to accept bookings, manage calendar, check-in with customer passcode, track earnings. | Native Mobile Bundle | Local storage / MMKV / Redux |

---

## 3. Authentication, Authorization & Identity Architecture

### 3.1 Customer Authentication
- **Transport:** JWT Bearer token in `Authorization: Bearer <token>` header.
- **Workflow:** 
  1. Customer submits phone number to `POST /api/v1/auth/send-otp`.
  2. Server generates a cryptographically secure 6-digit random OTP (or verifies against strictly protected QA test credentials).
  3. Customer submits OTP to `POST /api/v1/auth/verify-otp`.
  4. Server validates phone, checks attempt count (max 5), verifies expiration (5 minutes), and returns an encrypted JWT signed with `JWT_SECRET`.
- **Protected Endpoints:** Guarded by `JwtAuthGuard` (`src/common/guards/jwt-auth.guard.ts`).

### 3.2 Companion Authentication
- **Transport:** JWT Bearer token in `Authorization: Bearer <token>` header.
- **Workflow:** 
  1. Companion submits phone number to `POST /api/v1/auth/send-otp`.
  2. Same secure OTP generation and verification rules apply.
  3. Companion JWT token payload contains `{ sub: companionId, phone, role: 'COMPANION' }`.
- **Protected Endpoints:** Guarded by `JwtAuthGuard` (`src/common/guards/jwt-auth.guard.ts`).

### 3.3 Admin Authentication & RBAC
- **Transport:** Double-token pattern (Access Token + Refresh Token in HttpOnly cookie or Bearer header).
- **Workflow:**
  1. Staff member submits work email and password to `POST /api/v1/auth/login`.
  2. Password verified using Argon2id / bcrypt with salted rounds.
  3. Account lockout enforced after 5 consecutive failed attempts.
  4. RBAC guards (`RolesGuard`, `PermissionsGuard`, `CityScopeGuard`) evaluate staff member's assigned role (`SUPERADMIN`, `OPS_MANAGER`, `SAFETY_AGENT`, `FINANCE_AGENT`) and city permissions.

### 3.4 S2S Mutual Authentication (Zero-Trust Internal Mesh)
Cross-service backend communication (e.g. Customer Backend triggering a booking request in Companion Backend; Companion Backend updating booking status in Customer Backend) is protected by:
- **Header:** `x-internal-token: <INTERNAL_SERVICE_SECRET>`
- **Guard:** `InternalServiceGuard` applied on all `/api/v1/internal/*` routes.
- **Failure Policy:** Requests lacking the token or presenting an invalid secret are immediately rejected with `401 Unauthorized` before invoking any service layer.

---

## 4. Test OTP (12345465) Security Hardening Rules

To support controlled QA without SMS gateway charges while preventing any production bypass:
1. **Never Universal:** The OTP `12345465` is never accepted for arbitrary phone numbers.
2. **Explicit Feature Flag:** Requires `OTP_TEST_BYPASS_ENABLED=true` in environment configuration.
3. **Explicit Allowlist:** Requires the caller's phone number to be explicitly listed in `OTP_TEST_ALLOWED_PHONES` (e.g., `+919999999991,+919999999992`).
4. **Production Fail-Fast:** If `NODE_ENV=production` and `OTP_TEST_BYPASS_ENABLED=true`, the server will log a fatal security warning and refuse the bypass.
5. **No Secret Logging:** The test OTP is never printed in application logs or sent in error responses.

---

## 5. End-to-End Business Workflows

### 5.1 Discovery & Public Companion Catalog
1. Customer Mobile opens Home/Discovery screen and calls `GET /api/v1/discovery/companions`.
2. Customer Backend validates customer session, extracts city/interest filters, and performs a live S2S HTTP request to Companion Backend `GET /api/v1/companions/public?city=...`.
3. Companion Backend filters approved, active companions, sanitizes private data (phone, address, full KYC are stripped), maps gallery photo URLs, and returns public companion summary cards.
4. Customer Backend validates the response schema and delivers it to Customer App. Zero mock data fallbacks are permitted.

### 5.2 Booking Lifecycle & Double-Booking Prevention
1. **Initiation:** Customer requests booking via `POST /api/v1/bookings`.
2. **Server-Side Pricing:** Customer Backend calculates total hours, applies hourly rate, platform fee (15%), and tax (18% GST). Never trusts client-supplied totals.
3. **S2S Request Creation:** Customer Backend calls Companion Backend `POST /api/v1/internal/companion/requests` with `{ bookingId, customerId, companionId, scheduledStartTime, scheduledEndTime, activity, city, totalAmount }`.
4. **Availability Lock:** Companion Backend checks for overlapping bookings in `CONFIRMED` or `IN_PROGRESS` status. If available, creates request with 15-minute expiration timer.
5. **Confirmation:** When Companion accepts via `POST /api/v1/requests/:id/accept`, status becomes `CONFIRMED`.
6. **Passcode Verification & Start:** Companion arrives at venue, enters Customer's 4-digit session passcode via `POST /api/v1/sessions/:id/verify-customer`. Companion Backend validates match, sets status `IN_PROGRESS`, and calls Customer Backend `POST /api/v1/internal/bookings/:id/status-update` to synchronize live status.
7. **Completion & Escrow Release:** Upon session end, Companion calls `POST /api/v1/sessions/:id/complete`. S2S callback marks Customer booking `COMPLETED`. Admin backend releases escrow into Companion earnings balance.

### 5.3 Payment & Razorpay Financial Flow
1. Customer Backend generates Razorpay Order via `POST /api/v1/payments/create-order`.
2. Mobile app opens Razorpay SDK checkout.
3. Upon payment completion, Razorpay dispatches webhook to `POST /api/v1/payments/webhook`.
4. Webhook handler computes HMAC-SHA256 signature using `RAZORPAY_WEBHOOK_SECRET` and verifies replay protection via `x-razorpay-event-id`.
5. Ledger entry created in PostgreSQL inside an atomic Prisma `$transaction`.

---

## 6. Campaign & Announcement Architecture

1. **Ownership:** Marketing campaigns and customer announcements are managed by the Admin Backend in `src/modules/marketing` (backed by the `announcements` database table).
2. **Access Control:** Only authenticated Admin staff with `MARKETING_WRITE` permissions can create, update, schedule, or archive campaigns.
3. **Public Exposure:** Published campaigns active within their `validFrom` - `validUntil` window are surfaced via `GET /api/v1/marketing/announcements/active`.
4. **Push Broadcast:** When an announcement is marked as `BROADCAST_NOW`, Admin Backend dispatches messages via Firebase Cloud Messaging (`FCM_SERVICE_ACCOUNT_KEY`).
5. **Draft & Expired Security:** Unpublished, draft, or expired campaigns are excluded at the database query level (`status = 'PUBLISHED' AND validUntil > NOW()`).

---

## 7. Infrastructure & Deployment Environment

| Resource | Development / QA | Production Target |
|---|---|---|
| **Container Engine** | Docker Compose v2 | AWS ECS Fargate / GCP Cloud Run / Azure Container Apps |
| **Relational Database** | PostgreSQL 16 (Local Docker + Azure Postgres) | Managed PostgreSQL (Azure Flexible Server / AWS RDS) |
| **Object Storage** | MinIO / Local FS (Mocked private directory) | AWS S3 / Azure Blob Storage with private bucket + presigned URLs |
| **Push Notifications** | Firebase Admin SDK (Emulator / Sandbox) | Firebase Cloud Messaging Production Project |
| **Payments** | Razorpay Test Mode (`rzp_test_*`) | Razorpay Live Mode with Webhook Secret verification |
| **Secrets Management** | `.env` (gitignored, validated at startup via Joi/class-validator) | AWS Secrets Manager / Azure Key Vault / HashiCorp Vault |

---

*Authored and certified by Antigravity Senior Architecture & Security Audit Team.*
