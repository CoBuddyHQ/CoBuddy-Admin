# Audit repair — 10 October 2026

Latest results: [13 October pre-push review](docs/PRE_PUSH_REVIEW.md) and
[current backend module structure](docs/BACKEND_STRUCTURE.md). The dated findings
below describe earlier checks; use the latest report for current counts and limits.

The supplied `Audit.docx` and the issues pasted in the request were reviewed against the actual repository and local PostgreSQL/Redis services. The twelve missing admin workflows now have authenticated, database-backed APIs and frontend adapters. External delivery and consumer-app dependencies listed below are still required; this report does not claim every product integration is production-ready.

## Findings verified against the current checkout

| Audit item | Verified result |
| --- | --- |
| Redis password mismatch / failing health | The current local Redis URL already contains authentication. Docker was stopped; services were started. After the backend restart, `/api/health` returned HTTP 200 with PostgreSQL and Redis connected. |
| Empty staff table / missing first administrator | Actual database `cobuddy` contains 10 staff records, including 2 active super administrators. No duplicate bootstrap account was created and no existing password was changed. |
| Fake login / missing JWT | The current checkout already verifies credentials through `/api/auth/login`, persists access and refresh tokens, attaches Bearer authorization, and handles token rotation. Wrong-password rejection and actual browser login were verified. Tokens are held in the existing session storage flow, not duplicated into Zustand. |
| Wrong API port | The ignored local frontend and backend environment files now both target port 4001. The backend on 4000 could not be identified as this checkout, so it was left untouched. A real browser login and protected API request were verified against port 4001. |
| Core modules use mock arrays | Customers, companions, verification, moderation, wallets and financial adapters already use HTTP in this checkout. The twelve unavailable workflow adapters were replaced with real HTTP implementations. No runtime mock-data fallback was added. |
| DTO mismatches | New workflows map database identifiers, localized labels, dates, state, percentages and numeric values to the frontend contracts. Existing core mappings were retained and regression-tested. |
| Booking route mismatch | Current adapters use `/operations/active-sessions`, `/operations/completed-bookings`, `/operations/cancelled-bookings` and `/bookings/disputes`, matching the current controllers. |

## Implemented workflows

All paths below are relative to `/api`. Controllers use the existing JWT/module authorization and audit logging. Scoped operations enforce city access; global configuration requires an unrestricted operator. Request bodies use strict runtime validation.

| Workflow | Implemented behavior |
| --- | --- |
| `/discovery/events` | List, create, validate dates/city, and set active state; persistent event banners and frontend mapping. |
| `/discovery/ranking-config` | Read/save the six actual ranking factors with a 100% total; persistent discovery UI settings and promotions tied to real verified companion IDs. |
| `/operations/city-launch` | Persistent launch planning, checklist transitions, required active venue before launch, city activation, waitlist records and manual approval with a daily cap. |
| `/operations/growth-abuse` | Scoped fraud flags, status transitions, account bans and actual referral-code disabling. |
| `/operations/venues` | Create, read, edit, deactivate and guarded deletion; real city IDs, localized fields and latitude/longitude validation, including zero coordinates. |
| `/platform-config/policy-docs` | Versioned drafts, edits, publishing/archiving, translated text, stored legal settings and consent reporting from recorded consent rows. |
| `/platform-config/training` | Persistent lessons, draft edits, publishing, guarded deletion and statistics from stored quiz/completion records. |
| `/marketing/notifications` | Drafts, scheduling, queueing, recipient delivery records and a server-side delivery gateway adapter. Retry uses stable idempotency keys; expired dispatch leases recover after a worker crash. Missing provider configuration disables sending and preserves drafts. |
| `/legal/data-privacy` | Scoped requests, review/fulfillment states, legal holds, authenticated JSON export, and guarded account disabling/profile erasure. Financial balances, unresolved payouts, active bookings and preservation holds prevent erasure. |
| `/legal/legal-requests` | Case references, account identity, agency, deadlines, evidence/response URLs, notes and guarded status transitions; preservation holds block account erasure. |
| `/support/tickets` | Global/scoped desk, ticket creation, replies, self-assignment, lead reassignment, escalation, resolution notes and ticket history. Assignment options do not require access to HR records. |
| `/support/sla-dashboard` | Overdue tickets and staff performance calculated from actual ticket records. Unmeasured historic resolution times display “Not measured.” |

Announcement, notification-template and referral-code endpoints were also added under `/marketing`. The existing referral-management page remains explicitly parked pending product decisions; this change does not invent a referral campaign UI.

Frontend forms use the shared authenticated client, real option IDs, server error messages and query invalidation. Failed creates preserve drafts. Workflow read failures show a retry state rather than a successful empty list. The twelve routes were removed from the release blocklist after integration testing.

## Database and local runtime

- Applied `20261010090000_admin_workflows` and `20261010100000_broadcast_recovery`; six migrations are now applied locally.
- Preserved existing rows. The pre-migration PostgreSQL backup is `.local-backups/cobuddy-before-audit-workflows-20261010.dump` (ignored by Git).
- The current workspace backend runs on port 4001. `/api/health` returned HTTP 200 with PostgreSQL and Redis connected. Port 4000 was occupied by a generic Node process whose working directory could not be verified, so it was left untouched.
- The ignored `cobuddy-backend/.env` and `cobuddy-frontend/.env.local` now consistently configure port 4001; tracked `.env.example` files retain the standard 4000 default. The frontend on port 3000 returned HTTP 200 for the login and Safety Analytics pages.
- Runtime verification: HTTP 200 health, both services connected, and **298 API operations** (73 added). Evidence: `test-results/audit-repair/runtime-verification.json`.
- Existing user changes to `HANDOVER_READINESS_REPORT.md` and `cobuddy-backend/test/results/api-smoke.json` were preserved. New smoke output was written separately.

For another checkout/database, install dependencies, run `npm --prefix cobuddy-backend run prisma:generate`, then `npm --prefix cobuddy-backend run prisma:migrate-deploy`, and rebuild both applications. Bootstrap an administrator only if that database has none. A local Prisma engine replacement initially encountered a Windows file lock; generated schema/types and the unchanged engine were verified, and all database/runtime checks passed.

## Verification

| Check | Result |
| --- | --- |
| Backend unit suites | 32 suites, 451 tests passed |
| Frontend contracts/authentication tests | 26 passed |
| HTTP API smoke | 419 passed, 0 failed, 0 skipped; 298 operations inventoried |
| Real PostgreSQL/Redis workflow integration | 21 grouped checks passed across all twelve workflows, permissions, holds, export, erasure and provider absence |
| Dispute/analytics integration | 22 checks passed |
| Shared Redis rate-limit integration | 11 checks passed across two backend instances |
| Full browser suite | 116 desktop/mobile tests passed |
| Updated workflow browser suite | 32 desktop/mobile tests passed after final functional changes |
| Final city-launch wording/disabled-control check | 2 desktop/mobile tests passed after the final UI clarification |
| Actual browser + backend + database | Real login/JWT, event save, reload persistence and database row check passed; support, venues and privacy pages loaded without browser errors |
| Build/static checks | Frontend production build, backend build, type checks, ESLint, Prettier, Prisma validation and Git whitespace checks passed |

The Playwright regression suites use deterministic HTTP fixtures to cover UI states. `scripts/verify-live-workflows.mjs` separately verifies actual HTTP and PostgreSQL without response fixtures, using temporary accounts and records that it cleans up. Screenshot: `test-results/audit-repair/live-event.png`. API smoke evidence: `test-results/audit-repair/api-smoke.json`.

## Remaining integration requirements and behavior boundaries

1. **Real push/SMS delivery requires a provider gateway.** No provider credentials were supplied and no real notification was sent. Configure server-only `NOTIFICATION_DELIVERY_URL` (HTTPS) and `NOTIFICATION_DELIVERY_TOKEN` (at least 32 characters). The gateway must resolve the submitted account ID/type to the destination, honor the `Idempotency-Key` header and return a successful JSON response containing `{ "status": "accepted", "messageId": "..." }`. The backend submits `recipientId`, `recipientType`, `title`, `message` and `category`. `SENT` records gateway acceptance, not device delivery. Browser settings never expose provider secrets.
2. **Consumer-app integration is separate.** Signup invitation enforcement, automatic waitlist admission and invitation delivery are not implemented in this admin repository. Those switches are disabled and manual approval is labeled accurately. Consumer policy acceptance, training completion/quiz intake and consumption of discovery settings must be connected by the relevant consumer application; the admin reads recorded values and does not fabricate activity.
3. **Privacy fulfillment is scoped.** JSON export currently includes the account profile, selected booking history and wallet ledger, excluding credentials and other-party details. Reviewed account deletion disables access, erases profile identifiers and redacts bank/UPI destination fields while clearing payout preferences. Legal holds and unsettled payouts block deletion. Historical financial, safety and legal records remain for separate retention review. This is not complete removal from backups, object storage or external services, and already fulfilled requests are not bulk reprocessed by the schema migration.
4. **Legal requests are case management.** Evidence and response links are recorded; the admin does not transmit law-enforcement responses or upload/preserve external evidence itself.
5. `/moderation/flagged-chats` remains intentionally unreleased because this repository has no chat transcript store or connected consumer-app provider. The backend returns 503 rather than inventing conversations or review outcomes.

## Follow-up implementation — 11 October 2026

The Safety Analytics report is now released. `GET /api/analytics/safety` calculates active restrictions, repeat-offender rate, fraud categories, and age-escalation resolution from full database aggregates rather than capped frontend lists. City-scoped staff aggregates are restricted to users in their assigned cities. The analytics index routes `SAFETY_OPERATOR` users to this report; unauthorized roles still receive no report links. The Flagged Chat Review gate remains until a real transcript source is supplied.

Follow-up verification against this checkout: frontend formatting, typecheck, lint, and 34 contract tests passed; the production build passed; the Safety Analytics role-routing browser test passed on desktop and mobile. Backend schema validation, typecheck, lint, 457 unit tests, and build passed. The real local API suite passed 300 operations / 422 checks with zero failures, including 21 workflow checks, 22 dispute/analytics checks, 11 Redis rate-limit checks, and 4 application-assignment checks. A live browser test created and removed a temporary local operator, signed in through the real UI, stored a JWT, and loaded Safety Analytics with HTTP 200; no fixture account was retained.

## Review repairs — 11 October 2026

The four findings from the subsequent code review are repaired:

- Analytics applies assigned city restrictions to every non-super-admin role, including safety operators, moderators, support and finance staff. City managers with an empty scope still receive no city data; unrestricted staff keep their permitted global reports.
- Reviewed companion deletion redacts the bank account name, IFSC, full number, last four digits and UPI ID; it removes verification/preference flags and clears the profile payout preference. Historical settled payout amounts, references and record links remain intact. Legal holds, wallet balances, active bookings and unsettled payouts continue to block deletion.
- The development `.env.example` Redis URL includes the password required by the checked-in Docker Compose service. CI retains its separate passwordless test Redis configuration.
- Interview time, interviewer and optional meeting URL persist in PostgreSQL and appear in list/detail reads. Only active, accepted staff with the review role and city access can be selected. Scheduling validates future times and HTTP(S) URLs, detects competing updates and prevents a status-only scheduling bypass. The frontend provides scheduling/rescheduling, reload persistence, reviewer-load retry and failed-save draft retention. Waitlisting clears the appointment. No invitation delivery is implied.

The additive `20261011130000_application_interviews` migration was applied to the local development database. Existing appointment details are left null when no data was previously recorded. Deployment environments must apply this migration before starting the updated backend.

Verification after these repairs:

- Backend schema validation, formatting, typecheck, lint, all **468 unit tests** and build passed.
- Frontend formatting, typecheck, lint, all **34 contract/session tests** and production build passed.
- All **122 desktop/mobile browser tests** passed, including interview error recovery, scheduling, reload and meeting-link removal.
- The real HTTP/database suite passed **301 operations / 423 smoke checks**, **22 dispute/analytics checks**, **11 Redis rate-limit checks**, **24 workflow checks** and **6 application lifecycle checks**, with no failures. It verifies scoped safety analytics, legal-hold/payout erasure blockers, bank/UPI redaction, preserved payout history and interview eligibility/persistence using disposable fixtures.
- Both existing local backend ports, **4000** and **4001**, were restored after regenerating Prisma; health checks report PostgreSQL and Redis connected.

Local smoke evidence: `cobuddy-backend/test-results/review-repairs/api-smoke.json`.
The external-provider and retention boundaries described above still apply.

