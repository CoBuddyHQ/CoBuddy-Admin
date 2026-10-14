# CoBuddy Release Guide

## Current Release Boundary

Frontend source, configuration, tests and dependencies live in `cobuddy-frontend/`.
Backend source, Prisma, Docker and server dependencies live in `cobuddy-backend/`.
Use `cobuddy-frontend/.env.local` for browser configuration and
`cobuddy-backend/.env` for server secrets. Each folder has its own `.env.example`
and lockfile. Root npm scripts delegate to these applications.

The twelve admin workflows in [AUDIT_REPAIR_REPORT.md](AUDIT_REPAIR_REPORT.md)
now have database-backed integrations. Provider delivery and consumer-app
dependencies described there still require acceptance testing. Safety analytics
and flagged chats remain blocked by `cobuddy-frontend/src/lib/release.ts`.
Growth, operational and city financial analytics now query the real database.
Flagged-chat review is also blocked
until a storage provider is integrated. Hiding a screen is not an API permission
boundary: the backend must continue enforcing staff roles and city scope.

The latest network-backed production audits report zero findings for both frontend
and backend. Including development tooling, the backend has 20 moderate affected-
package findings and the frontend has 9 high findings. These are not independent
exploit counts. The remaining chains involve `sprintf-js` and `braces`; track
upstream patches rather than accepting automatic tool/framework downgrades.
The CI and production-build audit gates still reject moderate or higher production
findings and currently pass. Repeat audits on the actual deployment lockfiles.

The backend now uses NestJS 11.2.7, Express 5.2.1, Jest 30.5.2 and the compatible
`@nest-lab/throttler-storage-redis` adapter. Query parsing explicitly preserves
bracket-array filters. Redis commands have bounded timeouts/retries and do not
fall back to unrestricted requests when the store fails. The migration follows
the official [NestJS guide](https://docs.nestjs.com/v11/migration-guide).
Swagger's YAML dependency is patched to 5.4.3. Frontend `sharp` is patched to
0.35.5 for the [upstream image-library advisory](https://github.com/advisories/GHSA-wq5f-xc86-pv6w).
Use Node.js 24 and install the corresponding lockfiles together; do not run
`npm audit fix --force`.

The escrow screen now shows real booking allocations and a separate wallet
directory. Wallet freezing and withdrawal limits are not implemented and are no
longer presented as working controls. Escrow release is an internal ledger
operation; it does not send a bank payment. Payment settlement, provider webhooks,
refund settlement, and reconciliation need provider-specific acceptance tests
before handling real money.

The Payout Records screen manages internal records only. Processing requires a
verified bank account belonging to the companion and a positive amount. Paid
records are terminal; only processing records can be marked paid or failed.
Recording payment requires a UTR. Concurrent changes are rejected with HTTP 409.
These protections do not initiate transfers or verify a UTR with a bank.

KYC auto-check returns HTTP 503 until a real verification provider is integrated.
Missing evidence is displayed as "Not checked"; the backend no longer generates
random verification results. Manual decisions accept pending cases only and claim
that state atomically with the applicant update and audit event. A resubmission
intake/reopen workflow and provider acceptance tests are still required.
Review any historical results produced by the old auto-check before relying on
them. This fix does not validate or modify previously stored verification results.

Manual decision requests accept only `APPROVED`, `REJECTED` or
`REQUEST_RESUBMISSION`. Rejection/resubmission requires a trimmed reason of 3-500
characters; optional review notes are limited to 1,000 characters. Review screens
require confirmation and preserve drafts after failed requests.

Verification settings accept only the four editable fields, not response metadata
such as `id` or `updatedAt`. Thresholds must be integers from 0 to 100 with reject
strictly lower than approve; JSON booleans must be actual booleans, not strings.
Partial updates are checked against current stored values in a serializable
transaction. A 409 requires reloading/reviewing current settings before retrying.
Saving a preferred provider or thresholds still does not activate an integration.

## Build and Verification

Use Node.js 24 and the committed lockfiles. Run from the repository root:

```sh
npm run install:all
npm --prefix cobuddy-backend run prisma:generate
npm run verify
npm run audit:production
npm --prefix cobuddy-frontend exec -- playwright install chromium
npm run test:browser
```

For source formatting, run `npm run format` from the repository root, or
`npm --prefix cobuddy-backend run format` for backend files only. `npm run
format:check` is read-only and included in frontend verification; backend CI also
runs its own format check. Lint rejects warnings, and TypeScript checks unused
locals/parameters. Generated files and lockfiles are not manually formatted.

With a disposable local PostgreSQL/Redis environment and backend `.env`, run
`npm --prefix cobuddy-backend run test:api`. The smoke test creates temporary staff
and sessions plus uniquely named KYC cases and removes its fixtures; do not point
it at production. It checks anonymous access controls, authenticated collection
reads, selected session/permission behavior, and isolated KYC writes including
concurrent decisions and transaction rollback. It also exercises the dispute and
wallet workflow and production Redis throttling across two local HTTP instances.
The rate-limit test uses expiring UUID-namespaced keys and removes only those keys;
it never flushes Redis. It does not validate every write or third-party provider.
Run build/verification and API tests sequentially because both rebuild backend
`dist`. Stop a backend watch process before running the build-based tests.
Keep backups and application logs out of Playwright's output directory; test runs
clean `test-results/playwright`. `.local-backups` and `.local-logs` are git-ignored.

`.github/workflows/verify.yml` runs frontend verification and backend checks with
isolated PostgreSQL/Redis services on pushes and pull requests. Require both jobs
in branch protection. The workflow is based on the official
[checkout](https://github.com/actions/checkout) and
[setup-node](https://github.com/actions/setup-node) actions.

## Configuration

### Vercel frontend

Create a Vercel project for this monorepo with **Root Directory** set to
`cobuddy-frontend` and the Next.js framework preset. The frontend package pins
`engines.node` to `24.x`, matching the repository `.nvmrc` and GitHub Actions;
Vercel selects Node 24.x from that package setting. Do not set the Vercel project
to Node 22.x.

`cobuddy-frontend/vercel.json` selects the Next.js preset, `npm ci` install and
`npm run build:vercel` build. Set **Root Directory** to `cobuddy-frontend` in the
Vercel dashboard; it is not a `vercel.json` setting. Leave Output Directory at the
Next.js default. The Vercel build validates `NEXT_PUBLIC_API_URL` before compiling
and fails for a missing, HTTP or localhost API URL. It validates only frontend
configuration and does not need backend database/JWT secrets. Do not use the
repository-wide `build:production` command for this frontend-only Vercel project.

Set the public API URL in both **Production** and **Preview** environments (use a
staging backend for Preview). Changing `NEXT_PUBLIC_*` requires a new deployment
because Next.js embeds these values into the browser build. A successful build
does not prove the API is reachable or CORS/authentication work; verify those
against the deployed URL. See [Vercel configuration](https://vercel.com/docs/project-configuration/vercel-json)
and [environment variables](https://vercel.com/docs/environment-variables).

Set `NEXT_PUBLIC_API_URL` to the publicly reachable backend URL ending in `/api`
(for example, `https://api.example.com/api`). `localhost` only works on the
developer's machine. Set the backend's `CORS_ORIGIN` to the admin site's HTTPS
origin. Deploy `cobuddy-backend/` separately to a Node.js 24 host with PostgreSQL
and Redis; the Vercel frontend project does not run the NestJS backend.

Configure the frontend `NEXT_PUBLIC_API_URL` at build time, for example
`https://api.your-domain.example/api`. Never put secrets in `NEXT_PUBLIC_*` values.
The browser must be able to reach this URL; `localhost` points to the visitor's
machine and is for local development only.

### SOS Google Maps

Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in the frontend environment (`.env.local`
for local development). Enable Maps JavaScript API and billing in the Google Cloud
project, restrict the key to that API and to the exact admin website referrers, and
allow `http://localhost:3000/*` only for local development. Restart the development
server after changing the key; production requires rebuilding because `NEXT_PUBLIC_*`
values are included at build time. See Google's
[Maps JavaScript setup guide](https://developers.google.com/maps/documentation/javascript/get-api-key).

Optionally set `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` to a JavaScript map ID; the default
is Google's `DEMO_MAP_ID`. The dashboard uses advanced markers, fits open alert
locations, focuses selected alerts, and links to Google Maps directions. Missing
or invalid coordinates remain visible in the alert list without a fabricated pin.
Missing keys, blocked scripts and authorization failures leave the alert list and
coordinate links available.

SOS alerts refresh every five seconds while the dashboard is visible. These are
the `SOSAlert.lat/lng` coordinates reported by the API, not a device tracking feed.
Status timestamps are not presented as GPS update timestamps. Continuous movement
requires an upstream authenticated location ingestion flow, which is not part of
this admin map. The API filters open statuses before its 500-record limit; the UI
warns when that limit is reached. Never infer an all-clear state from a failed read.

With deployment variables injected into the build environment, run:

```sh
npm run check:production-config
npm run build:production
```

The preflight compiles the backend and validates its production configuration plus
the frontend's explicit HTTPS API hostname and `/api` path. It reads process
environment variables, not local `.env` files, and never prints their values.
`build:production` adds the dependency audit and frontend build. The audit now
passes; actual deployment configuration is still required. Ordinary `npm run build` is useful for local tests
but is not release approval. Preflight does not test credentials, connectivity,
provider delivery or infrastructure; run staging acceptance separately.

For the backend, use `NODE_ENV=production`, a PostgreSQL `DATABASE_URL`, Redis
`REDIS_URL`, three distinct generated JWT secrets, and a 64-character hexadecimal
`ENCRYPTION_KEY_PII`. Set `CORS_ORIGIN` to exact HTTPS admin origins (comma-separated)
and `FRONTEND_URL` to the admin HTTPS origin, without paths, queries or fragments.
Localhost and loopback origins are rejected in production/staging. JWT TTLs use
positive compact durations, such as `15m` and `7d`.
Configure Resend with a verified sender for
password recovery and invitations. Startup validates these settings. Store them
in the hosting platform's secret manager, not source control or container images.

Providing `ENCRYPTION_KEY_PII` does not itself encrypt Prisma data: application-level
PII encryption is not integrated and needs separate implementation and review.

Terminate HTTPS at a trusted ingress, expose only the frontend/API ports, and keep
PostgreSQL and Redis on private networks. The API does not trust arbitrary forwarded
IP headers. Set `TRUST_PROXY` to a comma-separated list of the actual ingress IPs
or narrowly scoped CIDRs. Empty means no trusted proxies; booleans, hop counts and
zero-prefix CIDRs are rejected. The ingress must overwrite forwarded headers.
Verify rate limits for separate clients and direct requests with forged headers;
never include networks from which untrusted clients can reach the API directly.
See the official [Express proxy guide](https://expressjs.com/en/guide/behind-proxies/).

## Database and First Admin

The current `db:seed` initializes the English reference language only. It does not
create accounts or sample business data. Set real policies and master data before
onboarding users. `db:inventory-demo` is a read-only candidate inventory, not a
deletion command; historical seed identifiers do not establish provenance.

Migration `20261005000100_dispute_refund_workflow` is additive. Back up the database
before applying it. It introduces structured dispute state, optimistic versions,
override fields and a unique refund link. Existing `PROCESSED` disputes are marked
`REFUND_REVIEW_REQUIRED` rather than credited again. Review their actual ledger and
settlement evidence separately. Deploy the matching API and frontend together:
dispute mutations now require a version and no longer accept direct paid-state
changes. The finance processor resolves linked disputes within the wallet-credit
transaction. This migration cannot verify historical bank payments.

1. Take and verify a database backup before an existing deployment is upgraded.
2. Run `npm --prefix cobuddy-backend run prisma:migrate-deploy` once per release.
3. Check `npm --prefix cobuddy-backend run db:status`.
4. On a new empty staff database, set `ADMIN_BOOTSTRAP_EMAIL`,
   `ADMIN_BOOTSTRAP_NAME`, and `ADMIN_BOOTSTRAP_PASSWORD` through a secret mechanism,
   then run `npm --prefix cobuddy-backend run admin:bootstrap` once. Use a unique
   password of 14-64 characters. The command refuses to replace existing staff or
   create another bootstrap admin when any super admin already exists.
5. Remove the bootstrap variables, sign in, and enroll two-factor authentication.

For recovery of an existing active, accepted super admin, supply `ADMIN_LOGIN_EMAIL`
(defaults to `admin@cobuddy.com`) and `ADMIN_LOGIN_PASSWORD` through the process
environment, then run `npm --prefix cobuddy-backend run admin:reset-password`.
Use 14-64 characters and at most 72 UTF-8 bytes. The command hashes the password and
revokes that account's sessions and reset links in one transaction. It preserves
roles, account status and MFA settings. Remove the temporary environment variables
afterward; do not put credentials in frontend source or a public login page.

Never use `prisma migrate dev`, `db push`, demo seeding, or a database reset during
production deployment. Run migrations using the build/release environment that
contains the Prisma CLI; do not reinstall tooling inside a live process.

## Runtime

The frontend builds with `output: standalone`. From `cobuddy-frontend/`, package `.next/standalone` together
with `public` and `.next/static` at the equivalent locations inside the standalone
directory. Start its `server.js` with the desired `PORT` and `HOSTNAME`.

The backend build is `npm --prefix cobuddy-backend run build`. Run
`npm run start:prod` from `cobuddy-backend` with production dependencies, generated
Prisma client, and runtime secrets. Use your process manager's restart policy and
graceful shutdown. Readiness is `GET /api/health`; it checks PostgreSQL and Redis.
Swagger is disabled in production and staging. API responses are marked `no-store`.
Server failures log correlation metadata without request bodies or credentials.
JSON and URL-encoded bodies have a 1 MiB limit; URL-encoded input is flat and capped
at 100 parameters. Malformed/oversized requests return safe 400/413 responses with
correlation IDs and `no-store`, without echoing submitted input.

## Required Launch Acceptance

- Confirm deployment hosts, HTTPS origins, secret storage, backups, recovery and alerting.
- Exercise each staff role, city restriction, token refresh/logout, recovery email and MFA.
- Verify finance state transitions under concurrent requests and with the selected payment provider.
- Test supported pages with representative production-sized data and pagination.
- Exercise critical safety workflows with actual location/media/notification providers.
- Finish each gated module with persistence, permissions, loading/error handling and integration tests before releasing it.

Local tests and builds are evidence of code correctness within their coverage, not
approval to deploy or proof that the missing integrations are complete.
