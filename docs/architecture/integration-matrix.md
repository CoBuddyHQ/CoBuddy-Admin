# CoBuddy Platform — End-to-End Integration Matrix

**Document Version:** 1.0.0-PROD  
**Status:** Grounded in Active Source Code & Live Process Verification  
**Date:** October 2026  

---

## 1. Evidence Level Definitions

To maintain absolute architectural rigor, every user journey in this matrix is tagged with its verified level of evidence:
1. **Level 1 (Code Path Exists):** Controller, service logic, routes, and DTOs exist in source code.
2. **Level 2 (Local Integration Test Passed):** Automated unit, e2e, or contract tests pass against real/mock local services.
3. **Level 3 (Live Runtime Verified):** Running services communicated over HTTP/TCP with real database persistence.
4. **Level 4 (Production Connectivity Verified):** Live production gateway/cloud provider credentials verified in active deployment.

---

## 2. Comprehensive Integration Matrix

| User Journey / Flow | Frontend Screen / Client | Calling API Route | Owning Backend Service | Internal S2S Dependency | Database Owner | Required Environment Variables | Auth Mechanism | Test Status | Live Verification Status |
|---|---|---|---|---|---|---|---|---|---|
| **Customer Registration & OTP Login** | Customer App (`LoginScreen.tsx`, `OtpVerificationScreen.tsx`) | `POST /api/v1/auth/send-otp`<br>`POST /api/v1/auth/verify-otp` | Customer Backend | None | Customer DB (`User`) | `JWT_SECRET`<br>`OTP_TEST_BYPASS_ENABLED`<br>`OTP_TEST_ALLOWED_PHONES`<br>`SMS_PROVIDER_API_KEY` | Public / Phone OTP validation | PASS (4 unit tests, e2e test) | **Level 3 (Live Runtime Verified)**<br>Tested on port 4002 with QA allowlist |
| **Companion Discovery & Catalog** | Customer App (`HomeDashboardScreen.tsx`, `ExploreScreen.tsx`) | `GET /api/v1/discovery/companions` | Customer Backend | Proxies to Companion Backend `GET /api/v1/companions/public` | Companion DB (`Companion`, `CompanionProfile`, `CompanionPhoto`) | `COMPANION_SERVICE_URL`<br>`JWT_SECRET` | Customer JWT Bearer | PASS (e2e discovery spec) | **Level 3 (Live Runtime Verified)**<br>Round-trip proxy 4002 -> 4001 tested with real Postgres data |
| **Campaign / Announcement Display** | Customer App (`HomeDashboardScreen.tsx` Banners) | `GET /api/v1/marketing/announcements/active` | Admin Backend | Optional via Customer Backend proxy | Admin DB (`Announcement`) | `ADMIN_BACKEND_URL` | Public / Customer JWT | PASS (Marketing unit tests) | **Level 3 (Live Runtime Verified)**<br>Tested on port 4000; returns published banners |
| **Server-Side Pricing & Booking Creation** | Customer App (`BookingDetailsScreen.tsx`, `ConfirmBookingScreen.tsx`) | `POST /api/v1/bookings` | Customer Backend | S2S calls Companion Backend `POST /api/v1/internal/companion/requests` | Customer DB (`Booking`) + Companion DB (`BookingRequest`) | `COMPANION_SERVICE_URL`<br>`INTERNAL_SERVICE_SECRET`<br>`DATABASE_URL` | Customer JWT + `x-internal-token` for S2S | PASS (Booking unit tests, S2S guard specs) | **Level 3 (Live Runtime Verified)**<br>Dispatches 4002 -> 4001, creates booking and request in DBs |
| **Companion Booking Acceptance** | Companion App (`RequestsScreen.tsx`, `IncomingRequestModal.tsx`) | `POST /api/v1/requests/:id/accept` | Companion Backend | Outbound status notification | Companion DB (`BookingRequest`, `Session`) | `DATABASE_URL`<br>`CUSTOMER_SERVICE_URL` | Companion JWT Bearer | PASS (Requests unit & e2e specs) | **Level 3 (Live Runtime Verified)**<br>Transitions to `CONFIRMED` in companion DB |
| **Arrival Check-In & Passcode Verification** | Companion App (`ArrivalCheckInScreen.tsx`) | `POST /api/v1/sessions/:id/verify-customer` | Companion Backend | S2S calls Customer Backend `POST /api/v1/internal/bookings/:id/status-update` | Companion DB (`Session`) + Customer DB (`Booking`) | `CUSTOMER_SERVICE_URL`<br>`INTERNAL_SERVICE_SECRET` | Companion JWT + `x-internal-token` for S2S | PASS (Sessions unit tests, e2e status callback) | **Level 3 (Live Runtime Verified)**<br>4-digit code verified, updates 4001 and 4002 synchronously |
| **Session Completion & Escrow Release** | Companion App (`ActiveSessionScreen.tsx`) | `POST /api/v1/sessions/:id/complete` | Companion Backend | S2S calls Customer Backend `status-update` with `COMPLETED` | Companion DB (`Session`, `Earning`) + Customer DB | `CUSTOMER_SERVICE_URL`<br>`INTERNAL_SERVICE_SECRET` | Companion JWT + `x-internal-token` for S2S | PASS (Sessions & Earnings unit tests) | **Level 3 (Live Runtime Verified)**<br>Marks completed, calculates companion payout |
| **Razorpay Payment Checkout** | Customer App (`PaymentScreen.tsx`) | `POST /api/v1/payments/create-order`<br>`POST /api/v1/payments/verify` | Customer Backend | Razorpay Orders API | Customer DB (`Payment`) | `RAZORPAY_KEY_ID`<br>`RAZORPAY_KEY_SECRET` | Customer JWT Bearer | PASS (Wallet & payment unit tests) | **Level 2 (Local Integration Test Passed)**<br>Requires live Razorpay secret in production |
| **Razorpay Webhook Handling** | Razorpay Cloud Infrastructure | `POST /api/v1/payments/webhook` | Customer Backend | None | Customer DB (`Payment`, `WalletTransaction`) | `RAZORPAY_WEBHOOK_SECRET` | HMAC-SHA256 signature verification | PASS (Webhook signature & replay specs) | **Level 2 (Local Integration Test Passed)**<br>HMAC validation verified; live webhook awaiting deployment |
| **Companion KYC Application Submission** | Companion App (`VerificationScreen.tsx`) | `POST /api/v1/profile/kyc/submit` | Companion Backend | None (stores encrypted doc URLs) | Companion DB (`CompanionProfile`) | `STORAGE_BUCKET_NAME`<br>`STORAGE_SECRET_KEY` | Companion JWT Bearer | PASS (Profile unit tests) | **Level 3 (Live Runtime Verified)**<br>Submits application to database |
| **Admin KYC Document Verification** | Admin Frontend (`/verification/applications`) | `PUT /api/v1/verification/applications/:id/decision` | Admin Backend | Updates companion status | Admin DB (`CompanionApplication`, `AuditLog`) | `JWT_SECRET`<br>`DATABASE_URL` | Staff Bearer (`COMPANION_VERIFY`) | PASS (Admin verification specs) | **Level 3 (Live Runtime Verified)**<br>Tested in browser; writes immutable audit record |
| **Safety SOS Alert & Emergency Escalation** | Customer / Companion App (`SafetyHubScreen.tsx`) | `POST /api/v1/safety/sos/trigger` | Admin Backend / Customer Backend | Dispatches incident to Admin Safety Dashboard | Admin DB (`SosAlert`, `AuditLog`) | `SMS_PROVIDER_API_KEY`<br>`EMERGENCY_CONTACT_GATEWAY` | User Bearer Token | PASS (Admin safety specs) | **Level 3 (Live Runtime Verified)**<br>Displays in live Admin SOS monitor |
| **Companion Payout Processing** | Admin Frontend (`/finance/payouts`) | `POST /api/v1/financial/payouts/:id/process` | Admin Backend | Bank Payout Gateway / RazorpayX | Admin DB (`PayoutRecord`, `AuditLog`) | `PAYOUT_GATEWAY_KEY`<br>`PAYOUT_GATEWAY_SECRET` | Staff Bearer (`FINANCE_WRITE`) | PASS (Admin payouts specs) | **Level 2 (Local Integration Test Passed)**<br>Database balance updated; banking gateway unverified |
| **Support Ticket Dispute Resolution** | Admin Frontend (`/moderation/disputes`) | `PUT /api/v1/operations/disputes/:id/resolve` | Admin Backend | Customer Wallet credit | Admin DB (`Dispute`, `RefundRecord`) | `DATABASE_URL` | Staff Bearer (`DISPUTE_WRITE`) | PASS (Operations disputes specs) | **Level 3 (Live Runtime Verified)**<br>Tested in Admin UI; resolves dispute atomically |

---

*Verified by CoBuddy System Architecture Group.*
