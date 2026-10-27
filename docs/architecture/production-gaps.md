# CoBuddy Platform — Production Readiness Gaps & Findings Log

**Document Version:** 1.0.0-PROD  
**Status:** Grounded in Active Source Code Audits & Test Results  
**Date:** October 2026  

---

## 1. Classification Taxonomy

Every item in this audit is categorized using four strict criteria:
- **Confirmed Defect:** Directly verified bug or security vulnerability in the current source code or reproducible via automated test.
- **Missing Implementation:** Required functional capability or business rule is entirely absent from the code.
- **Integration Unverified:** Implementation exists in code, but live production credentials, third-party sandboxes, or external cloud infrastructure are unverified.
- **Improvement:** Recommended hardening, resilience, or performance enhancement beyond baseline requirements.

---

## 2. Categorized Findings & Production Gaps

### 2.1 Confirmed Defects (All Fixed & Verified)

#### DEF-01: Double URL Prefix on Companion Public Discovery Endpoint
- **Category:** Confirmed Defect (Resolved)
- **Repository:** `CoBuddyCompanionBackend`
- **Location:** `src/modules/profile/public-companion.controller.ts`
- **Impact:** Controller was decorated with `@Controller('api/v1/companions/public')`. In NestJS `main.ts`, `app.setGlobalPrefix('api/v1')` was active, resulting in a double prefix route `http://localhost:4001/api/v1/api/v1/companions/public`. All proxy calls from Customer Backend failed with HTTP 404.
- **Fix Implemented:** Changed controller decorator to `@Controller('companions/public')`. Route now cleanly resolves to `/api/v1/companions/public`.
- **Verification:** Unit tests and live HTTP curl test returned HTTP 200 with companion cards.

#### DEF-02: Gallery Photo Property Mismatch in Public Companion DTO
- **Category:** Confirmed Defect (Resolved)
- **Repository:** `CoBuddyCompanionBackend`
- **Location:** `src/modules/profile/public-companion.controller.ts:46`
- **Impact:** Controller mapped `p.photoUrl`, but the Prisma schema model `CompanionPhoto` defined the attribute as `url`. All photos evaluated to `undefined` in the discovery card payload.
- **Fix Implemented:** Updated mapping to `(p: any) => p.url || p.photoUrl`.
- **Verification:** Live S2S call confirmed photo URLs populated in response array.

#### DEF-03: Hardcoded Dummy Companion and Campaign Data in Customer Mobile
- **Category:** Confirmed Defect (Resolved)
- **Repository:** `CobuddyCustomerIntegration`
- **Location:** `src/screens/home/HomeDashboardScreen.tsx`, `src/screens/home/CompanionProfileScreen.tsx`
- **Impact:** Hardcoded static companion arrays (`MOCK_COMPANIONS`) and fake banner arrays (`CAMPAIGNS`) were being rendered instead of live API responses.
- **Fix Implemented:** Replaced all hardcoded arrays with live Axios API calls to `/api/v1/discovery/companions` and `/api/v1/marketing/announcements/active`. Added robust loading, empty, and retry UI states.
- **Verification:** Verified via code inspection and clean TypeScript build (`tsc --noEmit` exit 0).

#### DEF-04: Hardcoded Mock Data Across Companion Mobile Screens
- **Category:** Confirmed Defect (Resolved)
- **Repository:** `CoBuddyCompanion`
- **Location:** `src/screens/sessions/ActiveSessionScreen.tsx`, `src/screens/earnings/EarningsScreen.tsx`, `src/screens/settings/SettingsScreen.tsx`
- **Impact:** Screens were using hardcoded mock session durations, mock earnings, and mock profile attributes.
- **Fix Implemented:** Refactored all screens to consume active Redux state and backend endpoints (`/api/v1/sessions/:id`, `/api/v1/earnings`).
- **Verification:** Automated unit tests (44/44 passing) and clean TypeScript compilation.

#### DEF-05: Missing Cross-Service Authentication Guard (Zero-Trust S2S Bypass)
- **Category:** Confirmed Defect (Resolved)
- **Repositories:** `CobuddyCustomerBackend` & `CoBuddyCompanionBackend`
- **Location:** `src/common/guards/internal-service.guard.ts`
- **Impact:** S2S endpoints were either unprotected or relied on client JWTs, allowing public users to fabricate booking requests or status updates.
- **Fix Implemented:** Created `InternalServiceGuard` verifying the `x-internal-token` header against `INTERNAL_SERVICE_SECRET`. Reject immediately with 401 if token is absent or invalid.
- **Verification:** Automated e2e tests in both backends verified missing/invalid token rejection (HTTP 401).

---

### 2.2 Missing Implementations (Action Required for Production)

#### IMPL-01: Live Automated Payout Gateway (RazorpayX / Cashfree Payouts)
- **Category:** Missing Implementation
- **Repository:** `CoBuddy-Admin` & `CoBuddyCompanionBackend`
- **Location:** `src/modules/financial/payouts/payouts.service.ts`
- **Current State:** Admin payout approval updates the local database status to `PROCESSED` and decrements companion balance, but does not initiate a real bank wire transfer via RazorpayX or Cashfree API.
- **Required Action:** Integrate banking API client with idempotency keys, dual-approval workflow, and payout webhook callbacks before processing real money withdrawals.

#### IMPL-02: Automated Dispute Refund Dispatch
- **Category:** Missing Implementation
- **Repository:** `CoBuddy-Admin`
- **Location:** `src/modules/operations-api/operations-api.service.ts`
- **Current State:** Resolving a customer dispute in Admin writes a `RefundRecord` in the database, but does not issue an automated refund call to the Razorpay Payments Refund API (`POST /v1/payments/{payment_id}/refund`).
- **Required Action:** Implement direct Razorpay refund API client triggered upon dispute approval.

#### IMPL-03: Real-Time WebSockets for Live Booking Status & Chat
- **Category:** Missing Implementation
- **Repositories:** `CobuddyCustomerBackend`, `CoBuddyCompanionBackend`
- **Current State:** Mobile clients currently poll REST endpoints for status changes. Socket.io gateways exist in skeleton form, but cross-server pub/sub (Redis adapter) is not configured.
- **Required Action:** Deploy Redis Socket.IO adapter to push instant booking arrival, acceptance, and cancellation events to active mobile apps without battery-draining polling.

---

### 2.3 Integrations Unverified (Live Credentials Required)

#### INT-01: Production SMS / OTP Provider (Fast2SMS / Twilio)
- **Category:** Integration Unverified
- **Repositories:** All Backends
- **Status:** Development and testing rely on the secured test OTP (`12345465`) with strict phone allowlists (`OTP_TEST_ALLOWED_PHONES`). Production SMS gateway API key and template IDs (`SMS_PROVIDER_API_KEY`, `SMS_TEMPLATE_ID`) must be provisioned and verified in staging before launch.
- **Risk:** High (Authentication gatekeeper).

#### INT-02: Production Razorpay Live Credentials & Webhook Secret
- **Category:** Integration Unverified
- **Repositories:** `CobuddyCustomerBackend`, `CobuddyCustomerIntegration`
- **Status:** Tested with sandbox keys (`rzp_test_*`). Live production merchant keys (`rzp_live_*`) and webhook secret (`RAZORPAY_WEBHOOK_SECRET`) must be configured in Azure Container Apps secrets.
- **Risk:** Critical (Financial processing).

#### INT-03: Production Cloud Object Storage (Private KYC Bucket)
- **Category:** Integration Unverified
- **Repositories:** `CoBuddyCompanionBackend`, `CoBuddy-Admin`
- **Status:** Local storage / mock MinIO is active in development. AWS S3 or Azure Blob Storage private container with short-lived presigned URLs (15-minute TTL) must be verified with active IAM credentials.
- **Risk:** Critical (Data privacy & regulatory compliance).

#### INT-04: Firebase Cloud Messaging (Production APNs / FCM Service Account)
- **Category:** Integration Unverified
- **Repositories:** `CoBuddyCompanionBackend`, `CobuddyCustomerBackend`
- **Status:** Push notifications tested with local mocks. Production `service-account.json` and Apple Developer APNs certificates must be uploaded to FCM console.
- **Risk:** Medium (Companion response time).

---

### 2.4 Improvements (Recommended Hardening)

#### IMP-01: Distributed Redis Rate Limiting
- **Category:** Improvement
- **Location:** All API Gateways
- **Recommendation:** Replace memory-based throttling (`@nestjs/throttler`) with Redis-backed rate limiting to enforce IP and user limits uniformly across multi-instance container replicas.

#### IMP-02: OpenTelemetry & Distributed Tracing
- **Category:** Improvement
- **Location:** All Backends
- **Recommendation:** Inject `x-correlation-id` at client gateways and propagate it across all S2S calls and database queries to enable unified request tracing in Grafana / Datadog.

---

*Certified accurate according to active codebase audit.*
