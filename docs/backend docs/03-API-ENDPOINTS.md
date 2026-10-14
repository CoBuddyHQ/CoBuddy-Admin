# CoBuddy Backend - Complete API Endpoints Catalogue

All endpoints are prefixed with: `{baseURL}/api` (e.g. `http://localhost:4000/api/auth/login`). The live OpenAPI spec at `/swagger-json` is the source of truth.

**Auth Rule**: Every endpoint below requires a valid JWT `Authorization: Bearer <accessToken>` **unless explicitly marked as [PUBLIC]**.

**Permissions**: Use `@Roles()` guard exactly matching the allowed roles from [permissions.ts](file:///d:/CoBuddy-Admin/src/lib/auth/permissions.ts).

**Standard Pagination**: Every list endpoint accepts query params:
- `?page=1&limit=20&sortBy=createdAt&sortOrder=desc&search=keyword&filters[status]=ACTIVE&dateFrom=ISO&dateTo=ISO`

---

## Table of Contents

1. [Auth (Login / 2FA)](#1-auth-login--2fa)
2. [Employees (Staff)](#2-employees-staff)
3. [Audit Logs](#3-audit-logs)
4. [Master Data](#4-master-data-18-tables)
5. [System Config + App Configs](#5-system-config--app-configs)
6. [Customers](#6-customers)
7. [Companions](#7-companions)
8. [Companion Applications](#8-companion-applications)
9. [Verification & Trust](#9-verification--trust)
10. [Moderation](#10-moderation)
11. [Safety Operations](#11-safety-operations)
12. [Operations & Bookings](#12-operations--bookings)
13. [Wallets & Financial](#13-wallets--financial)
14. [Support](#14-support)
15. [Discovery & Ops](#15-discovery--ops)
16. [Platform Config](#16-platform-config)
17. [Privacy & Legal](#17-privacy--legal)
18. [Marketing](#18-marketing)
19. [Analytics (4 Dashboards)](#19-analytics-4-dashboards)
20. [Socket.io Channels (Real-time)](#20-socketio-real-time-channels)

---

## 1. Auth (Login / 2FA)

| Method | Path | Roles | Description |
|---|---|---|---|
| `POST` | `/auth/login` | [PUBLIC] | Email/password. Returns session data, or a 2FA-required error with an MFA token |
| `POST` | `/auth/forgot-password` | [PUBLIC] | Body: `{ email }`. Always returns a generic success message; sends a one-hour reset link when the active account exists. |
| `POST` | `/auth/reset-password` | [PUBLIC] | Body: `{ token, password }`. Uses the reset link once, updates the password, and revokes existing sessions. |
| `POST` | `/auth/verify-2fa` | [PUBLIC] | Body: `{ mfaToken, otp }` |
| `POST` | `/auth/refresh` | [PUBLIC] | Body: `{ refreshToken }` |
| `POST` | `/auth/logout` | Authenticated | Body: `{ refreshToken }` |
| `DELETE` | `/auth/sessions` | Authenticated | Revoke all active sessions |
| `GET` | `/auth/me` | Authenticated | Current staff profile |
| `POST` | `/auth/2fa/setup` | Authenticated | Create TOTP secret and QR code |
| `POST` | `/auth/2fa/confirm` | Authenticated | Body: `{ otp }` |
| `POST` | `/auth/2fa/remove` | Authenticated | Body: `{ password }` |

---

## 2. Employees (Staff)

**Roles allowed**: SUPER_ADMIN, HR_ADMIN

| Method | Path | Roles | Description |
|---|---|---|---|
| `GET` | `/employees` | SUP, HR | Paginated list. Filter: `?filters[status]=ACTIVE`, `?filters[department]=SUPPORT`, `?search=name` |
| `GET` | `/employees/:id` | SUP, HR | Full employee detail incl. roles, city scope, last login |
| `POST` | `/employees` | SUP, HR | Create employee + send invite email. Body matches `AddEmployeePayload` in frontend. Returns invite link |
| `PUT` | `/employees/:id` | SUP, HR | Update profile fields (name, phone, designation, department, reportingManagerId) |
| `PATCH` | `/employees/:id/roles` | SUP, HR | **Update roles + city scope**. Body: `{ roles, cityScope? }` (matches `UpdateEmployeeRolesPayload`) |
| `PATCH` | `/employees/:id/status` | SUP, HR | Toggle `ACTIVE <-> SUSPENDED`. Body: `{ status, reason? }` |
| `POST` | `/employees/:id/resend-invite` | SUP, HR | Resend onboarding email, regenerate token |
| `POST` | `/employees/:id/accept-invite` | [PUBLIC via token] | Body: `{ inviteToken, password, name? }` |
| `POST` | `/employees/:id/force-logout` | SUP, HR | Delete ALL refresh sessions for this employee |
| `PATCH` | `/employees/:id/update-last-login` | INTERNAL | (Use automatically in login flow) |

---

## 3. Audit Logs

**Roles allowed**: SUPER_ADMIN (only — per [permissions.ts](file:///d:/CoBuddy-Admin/src/lib/auth/permissions.ts))

| Method | Path | Roles | Description |
|---|---|---|---|
| `GET` | `/audit-logs` | SUP | Full paginated logs. Filters: `?filters[adminId]=xyz`, `?filters[action]=BAN_USER`, `?filters[moduleAffected]=System`, `?dateFrom`, `?dateTo` |
| `GET` | `/audit-logs/count` | SUP | Count by module / action for dashboard summary tiles |
| `POST` | `/audit-logs` | INTERNAL | Auto-logged by `AuditLogInterceptor`. Don't call from frontend. |
| `GET` | `/audit-logs/login-history/:adminId` | SUP, SELF | Recent login attempts, IPs, devices (re-use in LoginHistoryCard component) |

---

## 4. Master Data (18+ Tables)

**Roles allowed**: SUPER_ADMIN only per permissions. Endpoint naming matches toggleXXX / addXXX functions in [master-data/api.ts](file:///d:/CoBuddy-Admin/src/modules/system/master-data/api.ts).

### Cities + Areas
| Method | Path | Description |
|---|---|---|
| `GET` | `/master-data/cities` | List all incl. areas + serviceHoursOverride. Include areas: `?include=areas` |
| `POST` | `/master-data/cities` | Add city |
| `PATCH` | `/master-data/cities/:id/toggle` | Flip `active` boolean |
| `PUT` | `/master-data/cities/:id/service-hours` | Body: `{ openTime, closeTime }` or `null` to remove override |
| `POST` | `/master-data/cities/:id/areas` | Body: `{ name: { en, hi }, lat?, lng? }` |
| `PATCH` | `/master-data/cities/:id/areas/:areaId/toggle` | Toggle area.active |

### Interests
| Method | Path | Description |
|---|---|---|
| `GET` | `/master-data/interests` | List |
| `POST` | `/master-data/interests` | Add |
| `PATCH` | `/master-data/interests/:id/toggle` | Toggle |
| `PATCH` | `/master-data/interests/:id/multiplier` | Body: `{ basePriceMultiplier }` |

### Spoken Languages
| Method | Path |
|---|---|
| `GET` | `/master-data/languages` |
| `POST` | `/master-data/languages` |
| `PATCH` | `/master-data/languages/:id/toggle` |

### App Languages
| Method | Path |
|---|---|
| `GET` | `/master-data/app-languages` |
| `POST` | `/master-data/app-languages` |
| `PATCH` | `/master-data/app-languages/:id/toggle` |

### Ticket Categories
| Method | Path |
|---|---|
| `GET` | `/master-data/ticket-categories` |
| `POST` | `/master-data/ticket-categories` |
| `PATCH` | `/master-data/ticket-categories/:id/toggle` |

### Incident Types
| Method | Path |
|---|---|
| `GET` | `/master-data/incident-types` |
| `POST` | `/master-data/incident-types` |
| `PATCH` | `/master-data/incident-types/:id/toggle` |

### Communication Styles
| Method | Path |
|---|---|
| `GET` | `/master-data/communication-styles` |
| `POST` | `/master-data/communication-styles` |
| `PATCH` | `/master-data/communication-styles/:id/toggle` |

### Activity Paces
| Method | Path |
|---|---|
| `GET` | `/master-data/activity-paces` |
| `POST` | `/master-data/activity-paces` |
| `PATCH` | `/master-data/activity-paces/:id/toggle` |

### Session Durations
| Method | Path |
|---|---|
| `GET` | `/master-data/session-durations` |
| `POST` | `/master-data/session-durations` |
| `PATCH` | `/master-data/session-durations/:id/toggle` |

### Notification Categories
| Method | Path |
|---|---|
| `GET` | `/master-data/notification-categories` |
| `POST` | `/master-data/notification-categories` |
| `PATCH` | `/master-data/notification-categories/:id/toggle` |

### Review Tags
| Method | Path |
|---|---|
| `GET` | `/master-data/review-tags` |
| `POST` | `/master-data/review-tags` |
| `PATCH` | `/master-data/review-tags/:id/toggle` |

### Dispute Reasons
| Method | Path |
|---|---|
| `GET` | `/master-data/dispute-reasons` |
| `POST` | `/master-data/dispute-reasons` |
| `PATCH` | `/master-data/dispute-reasons/:id/toggle` |

### Cancellation Reasons
| Method | Path |
|---|---|
| `GET` | `/master-data/cancellation-reasons` |
| `POST` | `/master-data/cancellation-reasons` |
| `PATCH` | `/master-data/cancellation-reasons/:id/toggle` |

### KYC Document Types
| Method | Path |
|---|---|
| `GET` | `/master-data/kyc-doc-types` |
| `POST` | `/master-data/kyc-doc-types` |
| `PATCH` | `/master-data/kyc-doc-types/:id/toggle` |

### Place Types (Allow List)
| Method | Path | Description |
|---|---|---|
| `GET` | `/master-data/place-types` | List with isAllowed flag |
| `PATCH` | `/master-data/place-types/:id/toggle` | Flip isAllowed |
| `PATCH` | `/master-data/place-types/:id` | Body: `{ displayName: { en, hi } }` |

### System Defaults
| Method | Path | Description |
|---|---|---|
| `GET` | `/master-data/defaults` | defaultCurrency, defaultLanguage, serviceHours, platformFeePercent |
| `PUT` | `/master-data/defaults` | Replace all defaults |

### Bulk Fetch Endpoint (Optimize Frontend App Boot)
| Method | Path | Description |
|---|---|---|
| `GET` | `/master-data/bundle` | SUPER_ADMIN + ANY staff — returns all active master data at once (`cities, languages, interests, ticketCategories, incidentTypes, reviewTags, disputeReasons, cancellationReasons, placeTypes, sessionDurations, defaults`). Reduces boot API calls from 12 to 1. Cached in Redis 5 min. |

---

## 5. System Config + App Configs

**Roles**: SUPER_ADMIN

| Method | Path | Description |
|---|---|---|
| `GET` | `/system/config` | Commission, pricing, service hours |
| `PUT` | `/system/config` | Update commission %, platform fees, global rules |
| `GET` | `/system/app-configs` | List of AppConfig rows (dynamic feature flags, min app versions) |
| `POST` | `/system/app-configs` | Add new config key |
| `PUT` | `/system/app-configs/:key` | Update config value |
| `DELETE` | `/system/app-configs/:key` | Remove |
| `GET` | `/system/health` | [PUBLIC] Health check (DB + Redis + uptime). Use for uptime monitoring. |

---

## 6. Customers

**Roles**: SUPPORT_AGENT, SUPPORT_LEAD, MODERATOR, SUPER_ADMIN

| Method | Path | Description |
|---|---|---|
| `GET` | `/customers` | Paginated list. Filter status, verificationStatus, cityId, search (name/phone/email) |
| `GET` | `/customers/:id` | Detail page data (wallet balance, flags, bookings count, verification status) |
| `PATCH` | `/customers/:id/status` | Body: `{ status: ACTIVE | SUSPENDED | BANNED, reason? }` |
| `PATCH` | `/customers/:id/verification-status` | Override KYC status manually |
| `GET` | `/customers/:id/booking-history` | Returns `BookingHistoryEntry[]` per frontend |
| `GET` | `/customers/:id/transactions` | Wallet transactions (paginated) |
| `GET` | `/customers/:id/reports` | Reports filed AGAINST + BY this customer |
| `POST` | `/customers/:id/adjust-wallet` | **DANGER — Finance/SUP only**: Body: `{ amount, type: CREDIT\|DEBIT, description }` + audit log required |
| `GET` | `/customers/:id/tickets` | Support tickets by this customer |
| `POST` | `/customers/:id/impersonate` | SUP only: Generate short-lived token (15min) to login-as-customer in apps (debug support) |

---

## 7. Companions

**Roles**: SUPPORT_AGENT, SUPPORT_LEAD, MODERATOR, FINANCE_ADMIN, SUPER_ADMIN

| Method | Path | Description |
|---|---|---|
| `GET` | `/companions` | Paginated list. Filters: status, verificationStatus, cityId, minTrustScore, minEarnings, search |
| `GET` | `/companions/:id` | Detail profile incl. pricing, languages, interests, bank account status |
| `PATCH` | `/companions/:id/status` | ACTIVE/SUSPENDED/BANNED |
| `PATCH` | `/companions/:id/verification-status` | Override KYC status |
| `GET` | `/companions/:id/trust-score-history` | `TrustScoreHistoryEntry[]` |
| `GET` | `/companions/:id/session-history` | `SessionHistoryEntry[]` (paginated) |
| `GET` | `/companions/:id/earnings-breakdown` | `EarningsBreakdown` (base, bonus, platformFeeDeducted, totalNet) — current month |
| `GET` | `/companions/:id/payouts` | Payout history |
| `GET` | `/companions/:id/reviews` | Reviews received + given |
| `GET` | `/companions/:id/bank-accounts` | List bank + UPI accounts |
| `POST` | `/companions/:id/approve-bank-account/:bankId` | Mark bank verified (FINANCE + SUP only) |
| `PATCH` | `/companions/:id/trust-score` | Manual override: Body `{ newScore, reason }` → creates TrustScoreHistoryEntry |
| `POST` | `/companions/:id/impersonate` | SUP only |

---

## 8. Companion Applications

**Roles**: MODERATOR, SUPER_ADMIN

| Method | Path | Description |
|---|---|---|
| `GET` | `/companion-applications` | Filter persisted application status, cityId and search; city-scoped, paginated records |
| `GET` | `/companion-applications/:id` | Stored profile, CV/portfolio URLs, review notes, reviewer/city labels and saved interview details |
| `POST` | `/companion-applications/:id/assign-self` | Atomically claim an open application using the authenticated staff identity |
| `PATCH` | `/companion-applications/:id/status` | Body: `{ status, reviewNotes }`. Changes open workflow state and clears the appointment; scheduling/approval/rejection require their dedicated actions |
| `GET` | `/companion-applications/:id/interviewers` | Active, accepted moderators/super admins with access to the application's city; returns only IDs and names |
| `POST` | `/companion-applications/:id/schedule-interview` | Body: `{ scheduledAt, interviewerStaffId, meetingLink? }`. Persists the future appointment, validates reviewer eligibility and detects competing application updates |
| `POST` | `/companion-applications/:id/approve` | Creates the Companion + Wallet and stores decision notes |
| `POST` | `/companion-applications/:id/reject` | Body: `{ reason }`. Closes the application with a recorded reason |
| `POST` | `/companion-applications/:id/add-note` | Body: `{ note }` → internal audit log |

Scheduling stores an appointment; it does not send an email, SMS or calendar invitation.
The saved `interview` appears on subsequent list/detail reads. Rescheduling without
`meetingLink` clears the previous link. Existing records without appointment data
return `interview: null` rather than fabricated details.

---

## 9. Verification & Trust

### Verification Queue
**Roles**: MODERATOR, SUPER_ADMIN

| Method | Path | Description |
|---|---|---|
| `GET` | `/verification/cases` | Filter `?status=PENDING_MANUAL_REVIEW\|AUTO_APPROVED\|APPROVED\|REJECTED`, `?applicantType=CUSTOMER\|COMPANION`. Use `?status=PENDING` alias for only manual |
| `GET` | `/verification/cases/:id` | Detail incl. documents URLs, auditTrail |
| `POST` | `/verification/cases/:id/decision` | Body matches `DecisionPayload`: `{ decision: APPROVE\|REJECT\|REQUEST_RESUBMISSION, reason?, notes? }` → Appends auditTrail event |
| `GET` | `/verification/thresholds` | `AutomationThresholds` |
| `PUT` | `/verification/thresholds` | Update thresholds (autoApprove/Reject %, liveness, provider) |
| `POST` | `/verification/re-run-auto-check/:caseId` | Re-run provider scoring |

### Trust Score Engine
**Roles**: SUPER_ADMIN, MODERATOR

| Method | Path | Description |
|---|---|---|
| `GET` | `/trust-score/dashboard` | Distribution histogram, top/bottom 10 companions |
| `GET` | `/trust-score/rules` | List of rules |
| `POST` | `/trust-score/rules` | Add rule: `{ trigger, delta, category, description }` |
| `PATCH` | `/trust-score/rules/:id` | Update |
| `DELETE` | `/trust-score/rules/:id` | Deactivate |
| `POST` | `/trust-score/recompute/:companionId` | Recompute from scratch (async job) |
| `GET` | `/trust-score/:companionId/history` | Same endpoint as companion history alias |

---

## 10. Moderation

### Reports & Warnings
**Roles**: MODERATOR (read/write self); SUP (all)

| Method | Path | Description |
|---|---|---|
| `GET` | `/moderation/reports` | Filter status, category, assignedToId |
| `GET` | `/moderation/reports/:id` | Detail + evidence + investigator notes |
| `POST` | `/moderation/reports/:id/assign` | Body: `{ staffId }` or empty → assign-to-self using auth user |
| `POST` | `/moderation/reports/:id/assign-me` | No body → auto-assign current staff |
| `PATCH` | `/moderation/reports/:id/status` | Body: `{ status, note }` → appends `investigatorNotes[]` entry with current staff |
| `POST` | `/moderation/reports/:id/ban-user` | Body: `{ duration: 24h\|7d\|PERMANENT, reason }` → creates UserBan row |
| `POST` | `/moderation/reports/:id/issue-warning` | Body: `{ message }` → Sends in-app notification to user |

### Bans & Suspensions
**Roles**: SUPER_ADMIN, MODERATOR

| Method | Path | Description |
|---|---|---|
| `GET` | `/moderation/bans` | List active + expired bans |
| `POST` | `/moderation/bans` | Manual ban — Body: `{ userId, userType, reason, duration, reportId? }` |
| `PATCH` | `/moderation/bans/:id/lift` | Body: `{ reason, staffId }` |
| `GET` | `/moderation/bans/:id/appeals` | Appeals for this ban |

### Flagged Chat Review
**Roles**: MODERATOR, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/moderation/flagged-chats` | List — filter `?severity=HIGH\|MEDIUM\|LOW`, `?status=PENDING\|REVIEWED` |
| `GET` | `/moderation/flagged-chats/:chatId` | Full transcript, flagged segments, participants |
| `POST` | `/moderation/flagged-chats/:chatId/decide` | Body: `{ action: TAKE_NO_ACTION\|WARN_BOTH\|WARN_SENDER\|BAN_SENDER, note }` |
| `GET` | `/moderation/chat-settings` | Auto-flag thresholds (toxicity %, keywords) |
| `PUT` | `/moderation/chat-settings` | Update thresholds, blocklist words, toxicity provider |

### Risk Scoring
**Roles**: MODERATOR, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/moderation/risk-scores` | Users sorted by risk |
| `GET` | `/moderation/risk-scores/:userId` | Risk factors breakdown |
| `GET` | `/moderation/risk-scores/config` | Rule weights |
| `PUT` | `/moderation/risk-scores/config` | Update |

### Reviews Moderation
**Roles**: MODERATOR

| Method | Path | Description |
|---|---|---|
| `GET` | `/moderation/reviews` | Filter `?status=PENDING\|APPROVED\|REMOVED\|FLAGGED`, rating, tagCodes |
| `POST` | `/moderation/reviews/:id/approve` | Approve |
| `POST` | `/moderation/reviews/:id/remove` | Body: `{ reason }` |
| `POST` | `/moderation/reviews/:id/flag` | Manual flag |

### Appeals
**Roles**: MODERATOR, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/moderation/appeals` | Filter status |
| `GET` | `/moderation/appeals/:id` | Detail |
| `PATCH` | `/moderation/appeals/:id/status` | REVIEWING → APPROVED (lifts ban + notifies) or REJECTED |
| `POST` | `/moderation/appeals/:id/add-note` | Internal |

---

## 11. Safety Operations

### SOS Dashboard
**Roles**: SAFETY_OPERATOR, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/safety/sos` | Active + recent resolved SOS. Filter `?status=TRIGGERED\|ACKNOWLEDGED\|ESCALATED_AUTHORITIES` |
| `GET` | `/safety/sos/:id` | Full detail — audio clip, location history, involved users, timeline |
| `POST` | `/safety/sos/:id/acknowledge` | Mark acknowledged + emit to socket |
| `POST` | `/safety/sos/:id/add-note` | Body: `{ note }` |
| `POST` | `/safety/sos/:id/resolve` | Body: `{ resolution: FALSE_ALARM\|REAL_INCIDENT, note }` |
| `POST` | `/safety/sos/:id/escalate-authorities` | Body: `{ officerName, firNumber?, note }` → flag in system |
| `GET` | `/safety/sos-stats/summary` | Today's triggered, acknowledged, avg-response-time |

### Geofence Alerts
**Roles**: SAFETY_OPERATOR

| Method | Path | Description |
|---|---|---|
| `GET` | `/safety/geofence/alerts` | Recent alerts. Filter `?seen=false`, `?zoneType=HIGH_RISK` |
| `POST` | `/safety/geofence/alerts/:id/mark-seen` | Acknowledge |
| `GET` | `/safety/geofence/zones` | Map data (GeoJSON for frontend map) |
| `POST` | `/safety/geofence/zones` | Create zone |
| `PATCH` | `/safety/geofence/zones/:id` | Edit boundary |
| `PATCH` | `/safety/geofence/zones/:id/toggle` | Active toggle |
| `DELETE` | `/safety/geofence/zones/:id` | Remove |

### Incident Center
**Roles**: SAFETY_OPERATOR, LEGAL_ADMIN, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/safety/incidents` | Filter status, type, `?legalEscalation=true` |
| `GET` | `/safety/incidents/:id` | Detail incl. evidence, notes, assignedInvestigator |
| `POST` | `/safety/incidents` | Manual log incident |
| `PATCH` | `/safety/incidents/:id/status` | Body: `{ status, note, staffId }` → appends investigatorNotes[] |
| `POST` | `/safety/incidents/:id/preserve-evidence/toggle` | Set preserveEvidence = true (legal hold, auto-extends S3 lifecycle) |
| `POST` | `/safety/incidents/:id/escalate-legal` | Toggle legalEscalation=true, auto-create LegalRequest if needed |
| `POST` | `/safety/incidents/:id/assign` | Assign investigator |

### Age / Minor Escalations
**Roles**: LEGAL_ADMIN, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/safety/age-escalations` | Filter status |
| `GET` | `/safety/age-escalations/:id` | Detail, evidence |
| `POST` | `/safety/age-escalations/:id/verify` | Body: `{ verified: MINOR\|ADULT, reviewNote }` |
| `POST` | `/safety/age-escalations/:id/close` | Close with note |

### Emergency Workflow
**Roles**: SAFETY_OPERATOR

| Method | Path | Description |
|---|---|---|
| `GET` | `/safety/emergency-workflow/config` | SLA durations, on-call staff list |
| `PUT` | `/safety/emergency-workflow/config` | Update |
| `POST` | `/safety/emergency-workflow/test-run` | Trigger dry-run of workflow (non-production) |

### Live Sessions (Safety View)
**Roles**: SAFETY_OPERATOR, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/safety/live-sessions` | All IN_PROGRESS/EXTENDED with location pinged in last 10min |
| `GET` | `/safety/live-sessions/:bookingId/location-trail` | Location history array for this session |
| `POST` | `/safety/live-sessions/:bookingId/safety-check` | Trigger in-app "Are you safe?" prompt to user |

---

## 12. Operations & Bookings

### Live Booking Map
**Roles**: SAFETY_OPERATOR, CITY_OPS_MANAGER, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/operations/live-map/companions` | City-scoped: array `[{ companionId, lat, lng, status }]` |
| `GET` | `/operations/live-map/active-bookings` | IN_PROGRESS + ARRIVING bookings with lat/lng of venue |
| `GET` | `/operations/live-map/sos-active` | OPEN SOS markers |

### Active Sessions
**Roles**: SAFETY_OPERATOR, CITY_OPS, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/operations/active-sessions` | ARRIVING + IN_PROGRESS + EXTENDED. City-filtered for CITY_OPS. |

### Completed Bookings
**Roles**: SAFETY_OPERATOR, CITY_OPS, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/operations/completed-bookings` | List paginated. Filters: cityId, dateFrom/to, companionId, customerId, search by bookingRef |
| `GET` | `/operations/completed-bookings/:id` | Detail — amounts, reviews, timestamps |
| `POST` | `/operations/completed-bookings/:id/adjust-platform-fee` | (FINANCE + SUP) Correct fee after the fact |

### Cancelled / Failed Bookings
**Roles**: SAFETY_OPERATOR, CITY_OPS, FINANCE, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/operations/cancelled-bookings` | Filter by canceller type, reason, refund status |
| `GET` | `/operations/cancelled-bookings/:id` | Detail + cancellation reason code + note |

### Session Audit
**Roles**: SAFETY_OPERATOR, CITY_OPS, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/operations/session-audit/:bookingId` | Full event stream — `SessionAuditLog[]` + ticket/report/SOS links |
| `POST` | `/operations/session-audit/:bookingId/tag` | Body: `{ tag, note }` (adds custom audit row) |

### Search & Matchmaking Config
**Roles**: CITY_OPS, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/operations/matchmaking/:cityId` | Get config for city |
| `PUT` | `/operations/matchmaking/:cityId` | Update config (radius, deadlines, retry count) |
| `POST` | `/operations/matchmaking/test` | Simulate match for given: `{ customerId, lat, lng, activity, start, duration }` → returns ranked list |

### Venue Management
**Roles**: CITY_OPS, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/operations/venues` | List in city. Filter `?active=true`, `?placeType=cafe`, `?search=` |
| `GET` | `/operations/venues/:id` | Detail |
| `POST` | `/operations/venues` | Add |
| `PUT` | `/operations/venues/:id` | Update |
| `PATCH` | `/operations/venues/:id/toggle` | active toggle |

### City Launch Management
**Roles**: CITY_OPS, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/operations/city-launch/:cityId/checklist` | Pre-launch checklist items completed status |
| `POST` | `/operations/city-launch/:cityId/mark-step` | Body: `{ stepKey, done, note }` |
| `POST` | `/operations/city-launch/:cityId/launch` | Activate a city after launch prerequisites pass; no sample records are created |

### Growth Abuse Monitoring
**Roles**: MODERATOR, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/operations/growth-abuse/suspects` | Accounts flagged for pattern abuse (multiple signups same IP/device) |
| `GET` | `/operations/growth-abuse/:suspectId` | Full analysis |
| `POST` | `/operations/growth-abuse/:suspectId/mark-benign` | False positive |
| `POST` | `/operations/growth-abuse/:suspectId/ban` | Create ban for user + linked accounts |

### Booking Disputes
**Roles**: FINANCE, SUPPORT_AGENT, SUPPORT_LEAD, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/bookings/disputes` | Filter status, disputeReason |
| `GET` | `/bookings/disputes/:id` | Detail incl. evidence, chat transcript |
| `POST` | `/bookings/disputes/:id/resolve` | Body: `{ verdict: FAVOR_CUSTOMER\|FAVOR_COMPANION\|SPLIT, refundAmount, creditAmount, note }` |
| `POST` | `/bookings/disputes/:id/add-evidence` | Upload additional file (S3 presigned) |

---

## 13. Wallets & Financial

### Escrow / Wallets
**Roles**: FINANCE, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/financial/wallets/:ownerType/:ownerId` | Single wallet detail (balances, last activity) |
| `GET` | `/financial/wallets/ledger/:walletId` | Double-entry ledger entries, paginated |
| `GET` | `/financial/escrow` | Escrow-balances per booking + total escrow held count/amount |
| `POST` | `/financial/escrow/:bookingId/release` | Release escrow → wallet credit companion → platform fee → ledger |
| `POST` | `/financial/escrow/release-stale` | FINANCE only cron-triggered to auto-release past `escrowReleaseAt` |

### Payouts
**Roles**: FINANCE (SUP sees all)

| Method | Path | Description |
|---|---|---|
| `GET` | `/financial/payouts` | Filter `?status=PENDING\|ON_HOLD\|PROCESSING\|PAID\|FAILED`, `?periodStart`, `?companionId` |
| `GET` | `/financial/payouts/:id` | Detail incl. bank account, UTR |
| `POST` | `/financial/payouts/:id/process` | Mark PROCESSING, trigger BullMQ payout job (calls Razorpay/UPI gateway) |
| `POST` | `/financial/payouts/:id/hold` | Body: `{ reason }` → ON_HOLD |
| `POST` | `/financial/payouts/:id/release` | Undo HOLD → PENDING |
| `POST` | `/financial/payouts/batch-process` | FINANCE only — `{ ids: [...] }` → Bulk process |
| `POST` | `/financial/payouts/generate-csv` | Export CSV for current filters (send email link) |
| `POST` | `/financial/payouts/:id/retry` | Retry FAILED payout |

### Refunds
**Roles**: FINANCE

| Method | Path | Description |
|---|---|---|
| `GET` | `/financial/refunds` | Filter status |
| `POST` | `/financial/refunds` | Manual refund (from finance outside a dispute): `{ bookingId?, customerId, amount, reason }` |
| `POST` | `/financial/refunds/:id/approve` | Create gateway refund call |
| `POST` | `/financial/refunds/:id/reject` | Body: `{ reason }` |

### Fraud Detection
**Roles**: FINANCE, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/financial/fraud/flags` | Filter `?status=OPEN`, `?category=PAYMENT` |
| `GET` | `/financial/fraud/flags/:id` | Detail + evidence |
| `PATCH` | `/financial/fraud/flags/:id/status` | DISMISSED/ACTION_TAKEN + actionsTaken[] |
| `GET` | `/financial/fraud/rules` | Rule list (velocity limits, etc.) |
| `PUT` | `/financial/fraud/rules/:id` | Update rule params |

### Tax / Invoices
**Roles**: FINANCE

| Method | Path | Description |
|---|---|---|
| `GET` | `/financial/tax-invoices` | List, filter status, date, user |
| `GET` | `/financial/tax-invoices/:id` | Detail (line items, GST) |
| `GET` | `/financial/tax-invoices/:id/pdf` | S3 presigned PDF download URL |
| `POST` | `/financial/tax-invoices/generate` | Body: `{ bookingId? , customerId? , companionId? , items }` → create DRAFT + PDF |
| `PATCH` | `/financial/tax-invoices/:id/issue` | Mark ISSUED + email to user |
| `PATCH` | `/financial/tax-invoices/:id/cancel` | Cancel + regenerate credit note if paid |
| `GET` | `/financial/tax/gst-summary` | Tax summary for period — `?period=2026-09` |

### Revenue Reports
**Roles**: FINANCE, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/financial/revenue/summary` | Today, Week, Month totals + comparison % |
| `GET` | `/financial/revenue/chart` | Body: `{ granularity: DAY\|WEEK\|MONTH, dateFrom, dateTo, cityId? }` → array { date, gross, platformFee, payout, refund, net } |
| `GET` | `/financial/revenue/by-city` | Per city breakdown |
| `GET` | `/financial/revenue/by-companion` | Top earners ranking |
| `GET` | `/financial/revenue/export` | Generate CSV for given filters → email link |

### Payment Reconciliation
**Roles**: FINANCE, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/financial/reconciliation` | Per-date summary: `{ date, matchedCount, mismatchedCount, diffAmount }` |
| `GET` | `/financial/reconciliation/mismatches` | List unmatched rows |
| `POST` | `/financial/reconciliation/:id/mark-matched` | Manual reconcile — `{ gatewayTxnId?, internalTxnId? }` |
| `POST` | `/financial/reconciliation/run` | Trigger job: import gateways CSV or API → match internally → email summary |

---

## 14. Support

### Tickets
**Roles**: SUPPORT_AGENT, SUPPORT_LEAD, MODERATOR, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/support/tickets` | My tickets / all. Filter: `?assignedTo=me`, `?status=OPEN\|IN_PROGRESS\|RESOLVED`, `?priority=HIGH`, `?categoryCode=payment_payout`, `?search=`, `?escalationLevel=L1` |
| `GET` | `/support/tickets/:id` | Full thread + audit + related booking/customer/companion |
| `POST` | `/support/tickets` | Manual create ticket (e.g. via inbound call): `{ userId, userType, categoryCode, priority, subject, firstMessage }` |
| `PATCH` | `/support/tickets/:id/status` | Body: `{ status, resolutionNote? }`. **NOTE**: If category = `age_minor_escalation` and status ∈ [RESOLVED,CLOSED], `resolutionNote` is **required** per [tickets/api.ts](file:///d:/CoBuddy-Admin/src/modules/support/tickets/api.ts). |
| `POST` | `/support/tickets/:id/reply` | Body: `{ message, attachmentUrls? }` → Support reply, auto-change status IN_PROGRESS, push to user via socket/email |
| `POST` | `/support/tickets/:id/assign-me` | Assign current staff |
| `POST` | `/support/tickets/:id/reassign` | Body: `{ staffId }` |
| `POST` | `/support/tickets/:id/escalate` | Bump escalationLevel L1→L2→L3, notify SUPPORT_LEAD/SUP |
| `GET` | `/support/tickets/:id/audit` | Full TicketAuditEvent[] |

### SLA Dashboard
**Roles**: SUPPORT_AGENT, SUPPORT_LEAD, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/support/sla/summary` | Breached % by category, avg resolution time, etc. |
| `GET` | `/support/sla/breaching` | Tickets at-risk to breach SLA in next 30min |
| `GET` | `/support/sla/breached` | Already breached |
| `GET` | `/support/sla/by-agent` | Per agent performance |

---

## 15. Discovery & Ops

### Discovery / Ranking Config
**Roles**: SUP, CITY_OPS

| Method | Path | Description |
|---|---|---|
| `GET` | `/discovery/ranking-config` | Return weights + rules |
| `PUT` | `/discovery/ranking-config` | Update all weights |
| `POST` | `/discovery/ranking-config/test` | Body: `{ companionIds[], customerId, lat, lng }` → returns re-ranked list + scores for debugging |

### Special Events
**Roles**: CITY_OPS, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/discovery/events` | Filter by city, active, featured |
| `GET` | `/discovery/events/:id` | Detail |
| `POST` | `/discovery/events` | Create |
| `PUT` | `/discovery/events/:id` | Update |
| `DELETE` | `/discovery/events/:id` | Soft delete |
| `PATCH` | `/discovery/events/:id/featured` | Toggle banner position |

---

## 16. Platform Config

### Training & Content
**Roles**: SAFETY_OPERATOR, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/platform-config/training` | List modules |
| `POST` | `/platform-config/training` | Create new module |
| `PUT` | `/platform-config/training/:id` | Update |
| `PATCH` | `/platform-config/training/:id/toggle` | Active |
| `DELETE` | `/platform-config/training/:id` | Remove |

### Policy & Legal Docs
**Roles**: LEGAL_ADMIN, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/platform-config/policy-docs` | All versions by docKey |
| `POST` | `/platform-config/policy-docs` | New version: `{ docKey, title, content, version, effectiveOn }` → notifies users on next app open |
| `PUT` | `/platform-config/policy-docs/:id` | Update unpublished draft |

### Announcements (marketing/notifications)
**Roles**: SUP, CITY_OPS

| Method | Path | Description |
|---|---|---|
| `GET` | `/marketing/announcements` | List |
| `POST` | `/marketing/announcements` | Draft. Body: `{ title, body, audience, cityIds?, publishedAt?, expiresAt? }` |
| `POST` | `/marketing/announcements/:id/publish` | Publish + send push notifications via FCMSocket |
| `DELETE` | `/marketing/announcements/:id` | Cancel draft or expire active |

### Referrals
**Roles**: SUP, CITY_OPS

| Method | Path | Description |
|---|---|---|
| `GET` | `/marketing/referrals/config` | Bonus amounts |
| `PUT` | `/marketing/referrals/config` | Update |
| `GET` | `/marketing/referrals/usage` | Stats — total codes, redemptions, bonus paid |
| `POST` | `/marketing/referrals/generate` | Manual batch generation for campaign |

### Staff Notifications
**Roles**: ANY authenticated (SELF only — staff get only their own)

| Method | Path | Description |
|---|---|---|
| `GET` | `/staff/notifications` | Unread + recent inbox |
| `POST` | `/staff/notifications/:id/read` | Mark single |
| `POST` | `/staff/notifications/read-all` | Mark all read |

---

## 17. Privacy & Legal

### Data Privacy Requests (DSAR)
**Roles**: LEGAL_ADMIN, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/legal/data-privacy` | List requests, filter status, type |
| `GET` | `/legal/data-privacy/:id` | Detail |
| `POST` | `/legal/data-privacy/:id/export` | Trigger BullMQ job → compile ZIP of user data → upload S3 → email requester + link on detail page |
| `POST` | `/legal/data-privacy/:id/erase` | GDPR right-to-erase: Anonymize user row + soft-delete chats + retain 7yr financials by law |
| `PATCH` | `/legal/data-privacy/:id/status` | Complete / reject |

### Legal Requests
**Roles**: LEGAL_ADMIN, SUP

| Method | Path | Description |
|---|---|---|
| `GET` | `/legal/requests` | List, filter status, preserveUntil |
| `GET` | `/legal/requests/:id` | Detail + documents |
| `POST` | `/legal/requests/:id/fetch-data` | Internal job: package requested data → encrypted S3 folder |
| `PATCH` | `/legal/requests/:id/status` | Mark fulfilled/appealed |
| `GET` | `/legal/requests/upcoming-preserve-expiry` | Preserve dates expiring in next 14 days (reminder) |

---

## 18. Marketing

### Push Notifications (Blast)
**Roles**: SUP, CITY_OPS

| Method | Path | Description |
|---|---|---|
| `GET` | `/marketing/notifications/templates` | List templates |
| `POST` | `/marketing/notifications/send-blast` | Body: `{ templateKey?, customSubject?, customBody?, targetAudience, cityIds?, filters }` → enqueue to BullMQ fanout job |
| `GET` | `/marketing/notifications/blast-history` | Past blasts with send counts, open rates, click rates |

---

## 19. Analytics (4 Dashboards)

All analytics endpoints return pre-aggregated data via Postgres CTEs / materialized views. Use caching (Redis 5 min).
**CityScope filtering is MANDATORY for CITY_OPS_MANAGER role.**

### Safety & Trust Analytics
**Roles**: SAFETY_OPERATOR, MODERATOR, SUP

| Method | Path |
|---|---|
| `GET` | `/analytics/safety/summary` | SOS triggered today, avg ack time, incidents open/closed, age escalations |
| `GET` | `/analytics/safety/chart` | Daily trend: SOS count vs resolved |
| `GET` | `/analytics/safety/hotspots` | High-incident lat/lng heatmap data |
| `GET` | `/analytics/safety/trust-distribution` | Trust score histogram buckets |
| `GET` | `/analytics/safety/ban-reasons` | Pie chart data |

### Financial Analytics
**Roles**: FINANCE, SUP

| Method | Path |
|---|---|
| `GET` | `/analytics/financial/summary` | Revenue, Payouts, Refunds, PlatformFee — Today/MTD/YTD + % change |
| `GET` | `/analytics/financial/revenue-chart` | Period selector |
| `GET` | `/analytics/financial/payouts-chart` | Paid vs pending over time |
| `GET` | `/analytics/financial/top-cities` | Revenue by city |
| `GET` | `/analytics/financial/health-metrics` | Escrow balance, fraud % of GMV, reconciliation backlog count |

### Operational Analytics
**Roles**: CITY_OPS, SUPPORT_AGENT, SUPPORT_LEAD, SUP

| Method | Path |
|---|---|
| `GET` | `/analytics/operational/summary` | Bookings completed today, active sessions, acceptance rate, avg wait time, cancelled % |
| `GET` | `/analytics/operational/bookings-chart` | Daily bookings with split: completed/cancelled/noshow |
| `GET` | `/analytics/operational/city-compare` | KPI table per city |
| `GET` | `/analytics/operational/supply-demand` | Supply gap per hour slot per city |
| `GET` | `/analytics/operational/sla` | Tickets SLA met % |

### Growth Analytics
**Roles**: SUP, CITY_OPS

| Method | Path |
|---|---|
| `GET` | `/analytics/growth/summary` | Total users, new users this month, active companions, retention rate (matches GrowthStats) |
| `GET` | `/analytics/growth/chart-signups-active` | Daily newSignups + activeUsers chart data |
| `GET` | `/analytics/growth/funnel` | Visitor → Signup → KYC → First booking → Repeat user |
| `GET` | `/analytics/growth/cohorts` | Monthly retention cohorts |
| `GET` | `/analytics/growth/referrals` | Referral stats |

---

## 20. Socket.io Real-time Channels

Namespace: `/` (or `/staff` for admin staff only — better to separate)

### Authentication
Client MUST send JWT via Socket.IO `auth.token` on handshake. Reject connection if missing/invalid/role not staff.

### Events Emitted By Server → Staff Client
| Channel/Event | Payload | Roles Listening |
|---|---|---|
| `sos:new` | `{ sosAlert: SOSAlert }` | SAFETY_OPERATOR, SUP |
| `sos:status-change` | `{ sosId, newStatus, acknowledgedBy? }` | Same |
| `geofence:alert` | `{ alert: GeofenceAlertEvent }` | SAFETY_OPERATOR |
| `live-map:companion-moved` | `{ companionId, lat, lng, timestamp }` | SAFETY_OPERATOR, CITY_OPS, SUP |
| `live-map:booking-status` | `{ bookingId, newStatus }` | Same |
| `staff:notification` | `{ notification: StaffNotification, unreadCount }` | Target staff only |
| `tickets:new-unassigned` | `{ ticketId, subject, categoryCode, priority }` | SUPPORT_LEAD, SUP |
| `tickets:assigned-to-me` | `{ ticket: SupportTicket }` | Assigned staff only |
| `moderation:report-assigned` | `{ reportId }` | Assigned staff |
| `sla:breaching` | `{ ticketId, minutesLeft }` | Ticket owner + LEAD |
| `financial:payout-batch-done` | `{ totalProcessed, failed }` | FINANCE |
| `audit:config-changed` | `{ module, adminName }` | SUP only |

### Events Client → Server
| Channel/Event | Payload | Purpose |
|---|---|---|
| `live-map:subscribe` | `{ cityIds: ['CITY-1'] }` | Opt-in to live updates per cities |
| `safety:sos-ack` | `{ sosId }` | Acknowledge alert (alternative to HTTP) |
| `ping` | empty | Connection keep-alive |

---

## 21. S3 Presigned Upload Endpoints

All document / evidence / media uploads use **presigned URLs** — backend never receives bytes:

| Method | Path | Description |
|---|---|---|
| `POST` | `/uploads/presign` | Body: `{ fileName, contentType, purpose: 'KYC_ID'\|'KYC_SELFIE'\|'REPORT_EVIDENCE'\|'INCIDENT_EVIDENCE'\|'TRAINING'\|'POLICY_PDF', entityId? }` → Returns `{ uploadUrl, fileId, downloadUrl }` |
| `POST` | `/uploads/:fileId/confirm` | Frontend calls after successful S3 PUT. Backend records it in DB. |
| `GET` | `/uploads/:fileId/download` | Generates short-lived download URL (validates user permission on entity owning the file) |

---

## 22. Quick Cross-Reference: Frontend api.ts → Backend Route

To integrate a module fast, open the module's `api.ts` (frontend) and map each method to one route above. Start with:

| Frontend Module | Frontend Methods to Replace | Backend Section |
|---|---|---|
| `system/employees` | 7 methods | Section 2 |
| `system/audit-logs` | 2 methods | Section 3 |
| `system/master-data` | 18 toggles + 18 adds | Section 4 |
| `verification` | getCases, submitDecision, getThresholds, updateThresholds | Section 9 |
| `companions` | getCompanions, getCompanionById, updateStatus + histories | Section 7 |
| `customers` | Same 6 methods | Section 6 |
| `support/tickets` | 8 methods incl. assign/escalate/reply | Section 14 |
| `moderation/reports` | 5 methods | Section 10 |
| `safety/incidents` | 6 methods | Section 11 |
| `financial/payouts` | 3 methods (list, process, hold) | Section 13 |
| `financial/revenue-reports` | getStats → Analytics | Section 13 + 19 |
| `operations/active-sessions` | getSessions | Section 12 |
| `analytics/growth` | getStats | Section 19 |

---

## 23. Next Document

Proceed to **[04-SECURITY.md](./04-SECURITY.md)** — mandatory security checklist + code-level implementation recipes.
