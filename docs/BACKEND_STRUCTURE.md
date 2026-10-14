# Backend structure — verified 12 October 2026

This describes the running code. The older numbered architecture documents include design proposals; they are not an inventory of implemented providers or infrastructure.

## Application boundaries

```
CoBuddy-Admin/
  package.json                 # Launches each application's scripts
  .nvmrc                       # Node 24
  cobuddy-frontend/
    src/                       # Next.js UI, shared Axios client, feature adapters
    .env.local                 # Ignored; browser API URL and public Maps key only
    package.json
    package-lock.json
  cobuddy-backend/
    src/
      main.ts                  # HTTP/CORS/validation/Swagger/bootstrap
      app.module.ts            # Registers feature modules and global guards
      common/
        auth/city-scope.ts     # Shared city-access rules
        decorators/           # Current staff, module/role permissions, audit metadata
        guards/               # JWT/session, module/role and resource access
        interceptors/         # Response envelopes and write audit trail
        filters/              # Consistent errors
        validation/           # Strict workflow request schemas
      config/                 # Environment, HTTP and Redis rate limits
      prisma/                 # Shared database client lifecycle
      modules/                # Controllers, services and DTOs by domain
    prisma/schema.prisma
    prisma/migrations/         # Ordered, committed database changes
    docker/                    # Local PostgreSQL 16 and authenticated Redis 7
    test/                      # Real HTTP/database regression scripts
    .env                       # Ignored; server credentials and configuration
    package.json
    package-lock.json
```

`npm run build:backend` compiles to `cobuddy-backend/dist/src/main.js`;
`npm run start:backend` uses that exact entry point. The root `src` live-map file
is a compatibility re-export; the maintained UI is in `cobuddy-frontend/src`.

## Feature ownership

| Nest module directory | API responsibility |
| --- | --- |
| `auth`, `employees`, `audit-logs` | Staff identity, sessions, employee administration and audit records |
| `customers`, `companions`, `companion-applications` | Profiles and onboarding/review/interview workflows |
| `verification`, `trust-score` | Manual KYC, stored thresholds, scores and history |
| `moderation` | Reports, bans, appeals, reviews, risk scoring and settings |
| `operations-api` | Sessions, booking lists, maps, disputes, audit and matchmaking settings |
| `safety-api` | SOS, incidents, geofence and emergency workflows |
| `catalog` | Discovery events/ranking/promotions, venues, city launch/waitlists and growth-abuse actions |
| `support` | Tickets, replies, assignment and SLA calculations |
| `legal` | Privacy requests, exports, reviewed deletion and preservation requests |
| `marketing` | Broadcast queue/delivery adapter, templates, announcements and referrals |
| `platform-content` | Policies, translations, lessons and stored consent/completion reporting |
| `admin-options`, `master-data`, `system` | Safe workflow choices, master data and global configuration |
| `wallets`, `financial/*` | Internal ledgers, escrow, payout/refund records, invoices and financial reporting |
| `analytics` | Database aggregates; controller and service are separate files |

Support, legal, marketing, content and catalog now have separate Nest modules.
They no longer share one catch-all `AdminWorkflowsModule`. All 301 HTTP operations
remain registered after this reorganization, as checked by the API smoke suite.

## Access and integration

Protected browser calls use `src/lib/api/client.ts`, which attaches the stored
access token and rotates an expired/missing access token using the refresh token.
Requests without either token stop locally. Opening a protected API in the address
bar does not attach these tokens and must return 401. Next.js `?_rsc=` navigation
responses on port 3000 are separate from business API calls.

The JWT guard reloads active employee roles and city assignments from the session.
The shared city helper treats SUPER_ADMIN as unrestricted and an empty
CITY_OPS_MANAGER scope as no access. Scoped KYC, trust scores, moderation,
operations, analytics and admin workflows apply their resource filters. Global
verification/trust/moderation/matchmaking configuration writes require unrestricted
city access. Other module/role restrictions still apply.

No account is seeded by starting the API. Use the guarded `admin:bootstrap` command
only for a database without an existing super administrator. Seeds contain reference
configuration, not fake business activity.

## Verification and deployment

Run `npm run verify`, `npm run test:api`, `npm run test:browser`,
`npm run test:live` and `npm run audit:production` from the repository root.
The API tests require local PostgreSQL/Redis and clean up their temporary fixtures.
`test:live` builds against its own ephemeral API port, tests actual browser writes,
then restores the frontend build using its normal environment. Do not run it
concurrently with another production frontend build; preview port 3108 must be free.

CI runs clean migrations, API regressions, browser tests and the real integration
runner. Local results do not certify a deployed environment. For Vercel, use the
frontend directory as the project root and Node 24.x; the Nest API requires its own
server and database/Redis configuration. Node 24 support is documented by
[Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

External KYC checks, chat transcripts, email/notification delivery, consumer-app
ingestion and real payment settlement have separate integration requirements.
See [DEPLOYMENT.md](../DEPLOYMENT.md) for the release boundary.
