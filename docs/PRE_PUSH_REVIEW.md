# Pre-push review — 13 October 2026

The twelve missing admin workflows identified in `Audit.docx` have frontend adapters
and authenticated database-backed APIs. This review repaired backend organization,
city-access gaps and application pagination. Results below were collected on
12–13 October. They verify the local checkout, not a deployed production system.

Follow-up: [Vercel verification](VERCEL_VERIFICATION.md) adds a frontend-only
deployment guard and records a successful local Vercel-configured build. Frontend
tests now total 37; live Vercel deployment checks still require the deployment URL
and connected account access.

## Repairs from this review

- Split `AdminWorkflowsModule` into catalog, support, legal, marketing,
  platform-content and admin-options modules. Separated the analytics controller
  from its module declaration. Shared validation, city access and label formatting
  now live under `common/`. All 301 HTTP operations remain registered.
- KYC list/count/detail/decision/provider-rerun access respects applicant city and
  account type. Identical IDs in customer and companion tables cannot grant access
  to the other account type.
- Fixed scoped access in trust dashboards/history/recompute, moderation reports/
  bans/appeals/reviews/risk scoring, and booking/dispute access for scoped roles
  other than CITY_OPS_MANAGER. Global verification/trust/moderation/matchmaking
  configuration writes reject city-restricted operators.
- Application queues use server pagination and status filters. Legacy PENDING and
  IN_REVIEW records remain visible with SUBMITTED and SCREENING. Changing a filter
  resets the page; older applications are reachable beyond the first 100 records.
- Removed obsolete Docker Compose configuration. The Redis environment example
  matches the authenticated local container.
- The live integration runner uses an ephemeral API port and restores the normal
  frontend build afterward. CI now runs this real browser/API/PostgreSQL workflow.
  Root backend verification includes formatting, matching CI.
- Added [current backend ownership and structure](BACKEND_STRUCTURE.md); the older
  architecture document is explicitly marked as a design specification.

## Verification results

| Check | Result |
| --- | --- |
| Docker PostgreSQL 16 / Redis 7 | Healthy; PostgreSQL accepting connections; authenticated Redis PONG |
| Existing migration status | All 7 migrations applied |
| Fresh database install | All 7 migrations applied; no Prisma schema drift; temporary database removed afterward |
| Backend unit tests | 468 passed, 32 suites |
| API inventory/smoke | 301 operations; 423 checks passed, zero failed/skipped |
| Real disputes/analytics regression | 22 checks passed |
| Real shared-Redis rate limits | 11 checks passed |
| Real admin workflows | 24 checks passed |
| Application lifecycle/pagination | 7 checks passed |
| KYC/trust/moderation city access | 55 HTTP checks passed |
| Frontend contract/session tests | 35 passed |
| Desktop/mobile browser suite, configured Maps key | 124 passed |
| Desktop/mobile browser suite, missing Maps key and CI API URL | 124 passed; zero failed, skipped or flaky |
| TypeScript, lint, formatting and production builds | Passed for both apps |
| Real browser/API/database workflow | Passed with no HTTP response fixtures |
| Production dependency audits | Zero reported vulnerabilities in either app |
| Runtime/lockfile consistency | Local Node v24.21.0; all manifests require 24.x; CI reads `.nvmrc`; manifests and lockfiles match |
| Git/environment checks | Whitespace check passed; no non-example env file tracked; local env/build/test/database artifacts ignored |

The full API suite also passed on a fresh database without demo data or an existing
administrator. The real browser test verified login/JWT, event persistence, the
application queue/assignment/waitlist, trust rules across an API restart, an exact
score override/reload and support/venue/privacy pages. Normal frontend configuration
was restored after both special builds.

The running development database had 73 public tables including migration metadata
and two active accepted super administrators. No existing administrator password
was changed. Temporary live/scope staff and the disposable database were verified
removed.

## Module coverage and remaining integrations

All 53 feature API adapters import the shared authenticated client. A source
inventory reconciled 172 static request expressions with registered routes.
Dynamic action/key/helper paths were reviewed separately; application helper paths
also have actual HTTP lifecycle tests. The twelve audit workflows are covered by
the admin-workflow API and browser suites. No runtime mock fallback was added.

These features still prevent a claim that the entire product is production-ready:

- Automated KYC has no verification-provider integration and deliberately returns
  503. Manual decisions work; provider intake/resubmission needs its upstream flow.
- Flagged-chat review remains gated until authenticated transcript storage exists.
- `RESEND_API_KEY` and notification-delivery URL/token are absent locally. Email
  delivery and actual broadcasts are unverified; saved drafts remain usable.
- Financial screens manage internal records and ledgers. Real transfers,
  settlement/provider webhooks and reconciliation require provider acceptance.
- Consumer-app ingestion, consent/training completion events and external data
  erasure/backups/retention processes remain separate integrations.
- Production preflight rejects the current shell's absent deployment secrets.
  No remote GitHub Actions run or Vercel deployment was performed.

Inventory checks prove route registration/authentication plus selected behavior;
they are not exhaustive business-transition, security or load testing. Some older
lists still use bounded result sets. See [DEPLOYMENT.md](../DEPLOYMENT.md) for the
release boundary and [BACKEND_STRUCTURE.md](BACKEND_STRUCTURE.md) for module mapping.

## Local use and commit readiness

The development frontend uses `http://localhost:3000`, with API base URL
`http://localhost:4001/api`. Health returned 200 with PostgreSQL and Redis connected
after the final backend restart. Matching environment files are ignored. Logs are
under `.local-logs/pre-push-*`.

Changes are **not committed or pushed**. The index is empty; the frontend move and
new backend modules/migrations are untracked. Include the intended folder move,
`.nvmrc`, new modules/tests and all three added migrations in the commit. Review the
staged diff so old-path deletions are paired with new frontend paths. Committing
only tracked modifications would omit the frontend and new backend modules.

Ignored local evidence:

- `cobuddy-backend/test-results/pre-push/clean-db-api-smoke.json`
- `cobuddy-backend/test-results/pre-push/frontend-route-inventory.json`
- `cobuddy-frontend/test-results/pre-push/missing-maps-browser.json`
- `cobuddy-frontend/test-results/live-workflows/result.json`
- `cobuddy-frontend/test-results/audit-repair/live-*.png`
