# CoBuddy Admin

Next.js admin frontend and NestJS/Prisma backend, maintained as separate applications.

## Folder layout

```text
CoBuddy-Admin/
  cobuddy-frontend/
    src/                    Pages, components, modules and authenticated API client
    public/                 Frontend assets
    tests/                  Frontend contracts and browser tests
    scripts/                Frontend build/preview and live integration checks
    .env.local              Local browser configuration (ignored by Git)
    .env.example            Frontend environment template
    package.json
    package-lock.json
  cobuddy-backend/
    src/                    Controllers, services, auth and authorization
    prisma/                 Schema and migrations
    docker/                 PostgreSQL and Redis configuration
    test/                   Real API/database integration tests
    .env                    Local server secrets (ignored by Git)
    .env.example            Backend environment template
    package.json
    package-lock.json
  package.json              Commands that delegate to the two applications
```

## Setup

Use Node.js 24 and Docker Desktop. From the repository root:

```sh
npm run install:all
npm --prefix cobuddy-backend run docker:up
npm --prefix cobuddy-backend run prisma:generate
npm --prefix cobuddy-backend run prisma:migrate-deploy
```

Before database commands, create `cobuddy-backend/.env` from its template and
configure PostgreSQL, Redis, JWT secrets and CORS. Create
`cobuddy-frontend/.env.local` from its template for the frontend.
Preserve existing local files. Backend secrets belong only in the backend.
The frontend's `NEXT_PUBLIC_*` variables are included in browser bundles.

For local development, the frontend API URL is `http://localhost:4000/api`.
The backend CORS origin and frontend URL must allow `http://localhost:3000`.
Changing a public frontend variable requires restarting development or rebuilding
production assets.

Run in separate terminals:

```sh
npm run dev:backend
npm run dev:frontend
```

Open [the admin panel](http://localhost:3000). The local backend's Swagger is at
[port 4000](http://localhost:4000/swagger). Swagger is disabled in production/staging.
Root `npm run dev` remains an alias for starting the frontend.

There is no shipped/default administrator password. On a new database with no
administrators, use `npm --prefix cobuddy-backend run admin:bootstrap` with privately
supplied credentials as described in [DEPLOYMENT.md](DEPLOYMENT.md).
The seed script initializes the English UI language; it does not create demo
people, bookings, policies or staff. Existing accounts should not be reset to
resolve a UI integration error.

## Verification

```sh
npm run verify
npm run test:browser
npm run test:api
```

The browser suite needs Chromium installed:
`npm --prefix cobuddy-frontend exec -- playwright install chromium`.
API tests use temporary fixtures in local PostgreSQL/Redis. Do not run them
against production. `npm run test:live` checks a built frontend against the real
local backend/database and cleans up its own records.

Each application can also be run independently with its own npm commands.
Root `npm run build`, `npm run typecheck` and `npm run lint` check both applications.
Root `npm run build:frontend` and `npm run build:backend` target one application.
Production builds and service commands are documented in [DEPLOYMENT.md](DEPLOYMENT.md).

## Integration status

Mock/demo cleanup and step-by-step browser/API/database verification are documented
in [VERIFY_BACKEND_INTEGRATION.md](docs/VERIFY_BACKEND_INTEGRATION.md).

Companion application assignment uses `POST /api/companion-applications/:id/assign-self`.
The backend takes the reviewer from the authenticated JWT, atomically claims the
application and persists `SCREENING`; the frontend displays this as `IN REVIEW`.
Saved assignments, city labels and review notes are returned by the API. Missing
profile fields display ?Not provided? instead of invented values or invalid dates.

See [AUDIT_REPAIR_REPORT.md](AUDIT_REPAIR_REPORT.md) for the twelve newly integrated
admin workflows and their remaining provider/consumer-app dependencies.
`analytics/safety` and `moderation/flagged-chats` remain unreleased.
Real notification delivery requires a configured server gateway. Financial records
and legal case management do not themselves execute external payments or legal submissions.

Local secrets, generated builds, backups and logs are ignored by Git.
