# CoBuddy Platform — Service Inventory & Component Catalog

**Document Version:** 1.0.0-PROD  
**Status:** Verified Against Active Source Code & Live Repositories  
**Date:** October 2026  

---

## 1. Inventory Summary Matrix

| Service Identifier | Repository | Stack / Framework | Active Branch | Baseline Commit | Port / URL | Health Check Endpoint | Database Ownership |
|---|---|---|---|---|---|---|---|
| **`cobuddy-customer-backend`** | `CobuddyCustomerBackend` | NestJS 10 / Prisma 7 / TypeScript | `feature/cross-backend-integration` | `cb0706a` | `4002` / `http://localhost:4002` | `GET /health` | Azure Postgres / `public` schema |
| **`cobuddy-companion-backend`** | `CoBuddyCompanionBackend` | NestJS 10 / Prisma 7 / pg-adapter | `feature/cross-backend-integration` | `531c783` | `4001` / `http://localhost:4001` | `GET /health` | Docker Postgres / `cobuddy_companion` |
| **`cobuddy-admin-backend`** | `CoBuddy-Admin` (`cobuddy-backend`) | NestJS 10 / Prisma 7 / TypeScript | `feature/cross-backend-integration` | `f327c82` | `4000` / `http://localhost:4000` | `GET /api/health` | Docker Postgres / `cobuddy_admin` |
| **`cobuddy-admin-frontend`** | `CoBuddy-Admin` (`cobuddy-frontend`) | Next.js 14 / React 18 / Tailwind | `feature/cross-backend-integration` | `f327c82` | `3000` / `http://localhost:3000` | Web Root (`/`) | Stateless |
| **`cobuddy-customer-app`** | `CobuddyCustomerIntegration` | React Native / TypeScript | `fix/security-production-hardening` | `e7ec9cc` | Mobile Client | N/A (Client) | AsyncStorage / SecureStore |
| **`cobuddy-companion-app`** | `CoBuddyCompanion` | React Native / TypeScript | `fix/security-production-hardening` | `aa1e533` | Mobile Client | N/A (Client) | Redux / MMKV Storage |

---

## 2. Detailed Service Profiles

### 2.1 Customer Backend (`cobuddy-customer-backend`)
- **Primary Responsibility:**
  - Manages Customer lifecycle (phone OTP login, profile updates, addresses, favorites).
  - Handles companion discovery by proxying to Companion Backend.
  - Computes pricing server-side, validates hours, and initiates bookings.
  - Razorpay order creation and webhook processing.
  - Manages customer wallet, transactions, and support tickets.
- **Runtime Environment:**
  - Node.js >= 18, NestJS 10, Prisma ORM 7.
  - Configuration: Loaded via `@nestjs/config` and validated at startup.
- **Authentication Method:**
  - Public routes: Phone OTP (`/api/v1/auth/send-otp`, `/api/v1/auth/verify-otp`).
  - Protected routes: JWT Bearer token validated via `JwtAuthGuard` (HS256).
  - S2S routes: `x-internal-token` header validated via `InternalServiceGuard`.
- **Database Ownership:**
  - Database: Azure PostgreSQL (`postgres`).
  - Tables Owned: `User`, `Booking`, `Payment`, `Wallet`, `WalletTransaction`, `Review`, `SupportTicket`, `CustomerAddress`.
- **Dependencies:**
  - S2S Target: Companion Backend (`COMPANION_SERVICE_URL`, default `http://localhost:4001`).
  - Gateway: Razorpay API (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`).
  - SMS: Configurable provider (`SMS_PROVIDER_API_KEY`).
- **Health Check & Failure Behavior:**
  - Health Endpoint: `GET /health` returns `{ status: 'ok', timestamp: ..., uptime: ... }`.
  - Failure Behavior: When Companion Backend is unreachable during discovery, returns a clean HTTP `503 Service Unavailable` with structured error `{ statusCode: 503, message: 'Companion service temporarily unavailable' }` rather than crashing or returning fake fallback data.

---

### 2.2 Companion Backend (`cobuddy-companion-backend`)
- **Primary Responsibility:**
  - Companion registration, onboarding status, and multi-step profile submission.
  - Manages calendar availability, hourly rates, and companion bio/photos.
  - Handles inbound booking requests from Customer Backend.
  - Tracks live session lifecycle (arrival, customer passcode verification, completion).
  - Maintains companion earnings ledger and withdrawal requests.
- **Runtime Environment:**
  - Node.js >= 18, NestJS 10, Prisma ORM 7 with `@prisma/adapter-pg`.
- **Authentication Method:**
  - Public routes: Phone OTP (`/api/v1/auth/send-otp`, `/api/v1/auth/verify-otp`).
  - Protected routes: JWT Bearer token validated via `JwtAuthGuard`.
  - S2S routes: `x-internal-token` validated via `InternalServiceGuard`.
  - Public Cards: `GET /api/v1/companions/public` accessible to authorized internal clients or public discovery.
- **Database Ownership:**
  - Database: Docker PostgreSQL (`cobuddy_companion`).
  - Tables Owned: `Companion`, `CompanionProfile`, `CompanionPhoto`, `CompanionService`, `Availability`, `BookingRequest`, `Session`, `Earning`, `Payout`, `Notification`.
- **Dependencies:**
  - S2S Outbound: Customer Backend (`CUSTOMER_SERVICE_URL`, default `http://localhost:4002`).
  - Push Notifications: Firebase Cloud Messaging (`FIREBASE_CREDENTIALS`).
- **Health Check & Failure Behavior:**
  - Health Endpoint: `GET /health` returns `{ status: 'ok', timestamp: ... }`.
  - Failure Behavior: If Customer Backend is offline when Companion completes a session, the S2S status update logs an error, queues an asynchronous retry, and preserves the local session state as `COMPLETED`.

---

### 2.3 Admin Backend (`cobuddy-admin-backend`)
- **Primary Responsibility:**
  - Operational administration for CoBuddy headquarters.
  - Verification & approval of companion applications and KYC documents.
  - User and companion moderation, suspensions, and trust score overrides.
  - Dispute resolution, refund approvals, and companion payout processing.
  - Emergency SOS monitoring, safety alerts, and audit logging.
  - Marketing announcements and campaign creation.
- **Runtime Environment:**
  - Node.js >= 18, NestJS 10, Prisma ORM 7.
- **Authentication Method:**
  - Staff Login: Work email and password (`POST /api/v1/auth/login`).
  - Tokens: Short-lived Access Token + Refresh Token rotation.
  - Authorization: RBAC (`RolesGuard`), fine-grained permissions (`PermissionsGuard`), and city data isolation (`CityScopeGuard`).
- **Database Ownership:**
  - Database: Docker PostgreSQL (`cobuddy_admin`).
  - Tables Owned: `Employee`, `Role`, `Permission`, `CompanionApplication`, `VerificationDocument`, `FlaggedChat`, `Dispute`, `RefundRecord`, `PayoutRecord`, `SosAlert`, `AuditLog`, `Announcement`, `CityMaster`.
- **Health Check & Failure Behavior:**
  - Health Endpoint: `GET /api/health` returns `{ status: 'ok', db: 'healthy', version: '0.1.0' }`.
  - Failure Behavior: Fails fast on invalid configuration (e.g., missing `JWT_SECRET` or missing database connection) during startup.

---

### 2.4 Admin Frontend (`cobuddy-admin-frontend`)
- **Primary Responsibility:**
  - Single-page operational web application for operations managers, safety officers, customer support agents, and finance staff.
- **Runtime Environment:**
  - Next.js 14 (App Router & Pages Router), React 18, TailwindCSS.
- **Authentication Method:**
  - Manages session tokens via authenticated HTTP client (`tests/frontend-auth.test.cjs` verified).
  - Automatically refreshes access tokens on `401 Unauthorized` without infinite retry loops.
  - Redacts sensitive credentials from browser console and error telemetry.
- **Dependencies:**
  - Consumes Admin Backend API (`NEXT_PUBLIC_API_URL` or server-side proxy).
- **Health & Failure Behavior:**
  - Displays graceful empty and error states across all workflow adapters (KYC, payouts, disputes, SOS) instead of crashing with React render exceptions.

---

### 2.5 Customer Mobile Application (`CobuddyCustomerIntegration`)
- **Repository Note:** The local repository directory `c:\Fr\cobuddycustomerupdated` has remote `git@github.com:CoBuddyHQ/CobuddyCustomerIntegration.git`. It is the active, authoritative Customer mobile codebase.
- **Runtime Environment:**
  - React Native 0.74+, TypeScript 5+, React Navigation.
- **Authentication & Storage:**
  - Stores customer JWT and refresh tokens in encrypted secure storage (`react-native-keychain` / `expo-secure-store`).
- **Dependencies:**
  - API Client: Centralized Axios instance pointing to `CUSTOMER_BACKEND_URL` (`http://localhost:4002` or production Azure gateway).
  - Razorpay Mobile SDK for in-app checkout.
- **Failure Behavior:**
  - Network timeouts trigger user-friendly retry banners; offline mode gracefully prevents double booking.

---

### 2.6 Companion Mobile Application (`CoBuddyCompanion`)
- **Repository Note:** Located in `c:\Fr\CoBuddyCompanion` with remote `https://github.com/CoBuddyHQ/CoBuddyCompanion-Integration.git`.
- **Runtime Environment:**
  - React Native 0.74+, TypeScript 5+, Redux Toolkit, Socket.io client.
- **Authentication & Storage:**
  - Companion JWT stored in secure persistent storage.
- **Dependencies:**
  - Consumes Companion Backend API (`http://localhost:4001`).
  - Firebase Cloud Messaging for inbound booking sound alerts and background notifications.
- **Failure Behavior:**
  - Offline session verification falls back to cached credentials; arrival check-in requires network confirmation to prevent fraudulent check-in.

---

*Verified by CoBuddy System Architecture Group.*
