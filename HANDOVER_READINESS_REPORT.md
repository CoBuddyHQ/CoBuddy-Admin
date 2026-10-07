# CoBuddy Handover Readiness

**Updated:** 2026-10-07 (Asia/Calcutta).
**Decision:** Engineering handover with explicitly documented incomplete scope only.
The full project is **not approved for production launch**.

## Implemented In This Pass

- Dispute reads and writes now enforce the same authenticated city scope, including combined staff roles. Mutations use optimistic versions and transactional state checks.
- Disputes have structured escalation, percentage and reason fields. UI labels consistently describe refund percentages, not penalties. Overrides use decimal currency arithmetic.
- A dispute refund request creates one linked finance request. Finance approval remains separately authorized. Only the committed wallet-credit transaction resolves the dispute as refunded. Concurrent requests/processing cannot double-credit the tested refund.
- Resolved/pending disputes cannot be reopened by an override. Historical `PROCESSED` flags migrate to `REFUND_REVIEW_REQUIRED`; no historical balances are changed or automatically credited.
- Support staff no longer need finance-settings permission to load disputes. Loading errors, retries, confirmation, pending states and failed-write draft preservation are implemented.
- Dispute and safety mutations now use class DTOs with enums, limits, null/type rejection and whitelisting. Missing age estimates are no longer fabricated as zero.
- Live Booking Map uses Google Maps and stored venue coordinates. Unlocated bookings stay visible without artificial markers. It polls actual bookings, reports request freshness and preserves the last received data during outages. Venue locations are not device tracking.
- Growth, session and city financial analytics now use backend database aggregates and city scoping. Removed fabricated retention, CAC, LTV and booking-funnel figures. Reports use UTC periods and identify unavailable denominators rather than inventing rates.
- Removed hard-coded runtime data and in-memory successful writes from the other 12 mock API adapters. Their typed contracts now reject unavailable operations. Their routes are gated in development as well as production; these integrations are not complete.
- Removed the development identity switcher, fabricated locality suggestions and synthetic ranking candidates. Area entry remains manual; no coordinates are invented.
- Replaced the demo seed with idempotent English reference-language initialization. It does not create people, business activity, credentials or financial balances.
- Fixed SOS test routing so application API fixtures cannot intercept Google's script. Added dispute and booking-map browser tests and a stalled-script deadline test. CI now builds with missing and fixture Maps keys.
- Applied targeted compatible frontend lockfile patches: `source-map-js` 1.2.2, `brace-expansion` 1.1.21/5.0.12, `postcss-selector-parser` 7.1.6 and `proxy-addr` 2.0.8. No force upgrade or framework downgrade was used.
- Migrated the backend to NestJS 11.2.7 / Express 5.2.1 with compatible Config, JWT, Swagger, CLI and testing packages. Replaced the outdated Redis throttle adapter with `@nest-lab/throttler-storage-redis` 1.2.0 and bounded Redis connection/command retries. Bracket-array query filters retain their previous behavior.
- Upgraded Jest to 30.5.2 with compatible TypeScript tooling and patched Swagger's YAML dependency to 5.4.3. The backend production dependency audit is now clean; no audit threshold was lowered.
- Patched frontend `sharp` to 0.35.5. A native WebP encoding check confirmed the patched binary and librsvg 2.63.2 load correctly.
- Fixed the Financial Analytics chart crash: its tick formatter no longer forwards the numeric tick index as a currency code. Added non-empty financial-data rendering, retry, login and hydration regression coverage.
- Login inputs and submission stay disabled until client hydration, avoiding native form submission before JavaScript is ready. A live browser login returned 201 and `/api/analytics/market` returned 200 with 10 city records; the chart/table rendered successfully. Temporary accounts were removed.
- Browser artifacts now use `test-results/playwright`; logs and retained backups live separately so test cleanup cannot remove them.
- Added the missing `/analytics` index route. After session verification it opens the first released report permitted for the current staff role; accounts without available reports receive an explicit message. Anonymous visitors still go to login. The local URL now returns HTTP 200 instead of 404.

## Verification

| Check | Evidence |
| --- | --- |
| `npm run verify` | Passed after dependency upgrades: frontend formatting, schema, types, lint, tests and builds; `npm run verify:frontend` passed again after the chart/login changes and analytics index fix |
| Frontend contract/session tests | 25 passed |
| Backend schema, types, lint, tests and build | Passed after clean installation; 30 suites / 425 tests |
| Backend formatting | Passed |
| Real HTTP API smoke | 319 passed, 0 failed/skipped; 225 operations inventoried |
| Real HTTP/DB dispute and analytics workflow | 22 passed, including cross-city rejection, malformed payload rejection, concurrent refund creation, finance authorization, single wallet credit and scoped analytics |
| Real Redis/two-instance throttling | 11 passed: shared quotas, concurrent enforcement, expiry, spoofed-IP rejection, fail-closed behavior and shutdown; isolated test keys removed |
| Backend clean dependency installation | `npm ci --ignore-scripts`, explicit Prisma generation and `npm ls --all` passed; no invalid peer dependencies |
| Full desktop/mobile browser run | 84 passed on the final rebuilt app, including analytics index routing/permissions, financial chart rendering, API retry, login hydration/session persistence and stalled Maps initialization; desktop/mobile financial screenshots inspected |
| Database migration | Additive dispute migration applied after local backup; 4 migrations total |
| Local running services | Frontend login HTTP 200; API health HTTP 200 with PostgreSQL and Redis connected |
| Frontend production audit after patch | 0 findings |
| Backend production audit | 0 findings; combined `npm run audit:production` gate passes |
| Full frontend tooling audit after patches | 9 high affected-package findings remain |
| Full backend audit including tooling | 20 moderate affected-package findings; 0 high/critical |

Audit counts include transitive affected packages and are not counts of independent exploits.
The remaining `braces` chain affects frontend development tooling; the backend
tooling findings trace to `sprintf-js` through Istanbul/Jest. Registry checks still
list affected versions 3.0.3 and 1.1.3, respectively, as latest. Do not accept the
audit tool's suggested framework/test-runner downgrades. Track upstream fixes and
keep the configured production audit gate enforced. A clean production audit is
not a substitute for application/provider acceptance or a full security review.

API tests use uniquely identified local fixtures and clean them up. They do not
seed operational data or reset an existing administrator. Browser tests use
isolated fixtures and block Google requests; they do not prove real provider
delivery. Current evidence does not cover every authenticated write or every
role/city combination. GitHub Actions itself has not been inspected or run here.

## Existing Database Data

No existing business records were deleted. A local PostgreSQL custom-format backup
was created before the migration. Its container copy was retained at
`/tmp/cobuddy-pre-handover.dump` and recovered to ignored
`.local-backups/cobuddy-pre-handover-20261005.dump` after browser-test cleanup
removed the original copy in `test-results`. Browser output is now isolated in a
subdirectory. A backup restoration drill has not been performed.

`npm --prefix cobuddy-backend run db:inventory-demo` reported these **candidates**:

| Legacy Seed Category | Count |
| --- | --- |
| Staff, including the current administrator | 9 |
| Test customer / test companion | 1 / 1 |
| Bookings / venue | 4 / 1 |
| Companion applications / verification cases | 2 / 3 |
| Reports / bans / reviews | 2 / 1 / 2 |

These identifiers may have been reused or linked to genuine activity. Review
provenance and dependencies before deletion; preserve the active administrator,
audit evidence and real records. Cleanup approval was requested and has not been
received. Removing source-code fixtures does not remove previously seeded rows.
Tests intentionally retain isolated fixtures as test coverage, not production data.

## Remaining Scope

| Area | Required Before It Can Be Released |
| --- | --- |
| Support tickets and SLA | Persisted ticket/reply/assignment workflows, staffing authorization, real SLA/completion metrics and end-to-end tests |
| Discovery events and ranking | Real identifiers, persistence, validated ranking/promotions and client integration |
| Legal/privacy requests | Evidence storage, legal-hold enforcement, approved export/deletion workflows, permissions and audit trails |
| Marketing notifications | Selected push/SMS provider, server-side credentials, delivery jobs, receipts, retries and audience scoping |
| City launch and waitlist | Persisted launch/checklist/waitlist model and authorized activation/invitation workflows |
| Venues and growth abuse | Real venue CRUD/location validation; enforceable abuse actions and detection inputs |
| Policies and training | Versioned publication, actual consent/completion tracking and user-facing integration |
| Safety analytics and flagged chats | Authoritative aggregates and authorized chat/evidence storage |
| KYC | Provider implementation and credentials, resubmission intake and provider acceptance tests; auto-check currently fails closed |
| Payments | Provider transfers/webhooks/settlement verification and reconciliation; internal wallet/UTR records do not prove bank settlement |
| Google Maps | Billing/API/referrer configuration and real deployment test; the previous live check returned `BillingNotEnabledMapError` |
| PII and infrastructure | Application-level encryption review, private storage, TLS/origins, mail delivery, monitoring, restore/load/rollback acceptance |
| Dependencies | Production audit is clean; track and resolve remaining frontend/backend development-tool advisories through tested updates |

The 12 unavailable adapters are: `discovery/events`, `discovery/ranking-config`,
`legal/data-privacy`, `legal/legal-requests`, `marketing/notifications`,
`operations/city-launch`, `operations/growth-abuse`, `operations/venues`,
`platform-config/policy-docs`, `platform-config/training`, `support/sla-dashboard`
and `support/tickets`. Disabling them is not a claim of implementation.

## Handover Conditions

1. Agree the delivered feature scope and assign owners to unfinished modules.
2. Keep the production dependency gate passing, address tooling advisories and obtain clean CI on the actual handover commit.
3. Confirm demo-data cleanup scope, review dependencies and verify the backup before removal.
4. Supply production/provider configuration through a secret manager; rotate temporary credentials and enroll MFA.
5. Validate real end-to-end workflows, Google billing, delivery/settlement, monitoring, restore and rollback on staging.
6. Deploy the additive migration and matching frontend/API together. Follow `DEPLOYMENT.md`; never reset a production database.

**No commit, push, production deployment or production sign-off has been performed.**
