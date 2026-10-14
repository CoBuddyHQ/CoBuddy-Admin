# Vercel verification — 13 October 2026

**Local deployment configuration and build passed. Live Vercel deployment is not
yet verified.** No deployment URL was supplied, no local Vercel project link or
CLI login was found, and the available Vercel plugin is not connected. No remote
deployment or project-setting change was made.

## Fixed and checked locally

- Added `cobuddy-frontend/vercel.json`: Next.js preset, `npm ci` install and
  `npm run build:vercel` build.
- Added a frontend-only preflight before the Vercel build. A missing, HTTP,
  localhost or malformed API URL fails the build instead of allowing the browser
  client to fall back to localhost. URL credentials are rejected without logging
  their values. Backend secrets and backend build output are not required.
- All 37 frontend contract/session/configuration tests passed. Changed files pass
  lint and formatting checks.
- `npm run build:vercel` passed with Node v24.21.0 and a placeholder HTTPS API
  URL, including TypeScript compilation and 65 static pages. This was a local
  Next.js build, not a Vercel cloud build or a connectivity test of the placeholder.
- Restored the normal build using local frontend configuration afterward.

Local build evidence (git-ignored):
`cobuddy-frontend/test-results/vercel-check/build.log` and `restore-build.log`.

## Required project settings

| Setting | Value |
| --- | --- |
| Root Directory | `cobuddy-frontend` (must be set in the Vercel dashboard) |
| Framework | Next.js |
| Node | `24.x` from the frontend package manifest |
| Install | `npm ci` |
| Build | `npm run build:vercel` |
| Output Directory | Next.js default |
| Production `NEXT_PUBLIC_API_URL` | Actual reachable HTTPS backend URL ending in `/api` |
| Preview `NEXT_PUBLIC_API_URL` | Reachable staging backend URL ending in `/api` |

The NestJS backend runs separately from this Vercel frontend project. Its
`CORS_ORIGIN` must include the exact frontend origin being tested. Configure
`FRONTEND_URL` for invitations/recovery links. Do not put database or JWT secrets
in the Vercel frontend's public environment variables. Rebuild after changing
`NEXT_PUBLIC_*`; they are embedded into the browser bundle.

## Remaining live checks

The deployment URL and public backend URL are needed to check page loading, static
assets, HTTPS, health and CORS. An authorized test session is also needed to verify
protected API requests and JWT refresh on that deployment. Connected Vercel access
is needed to inspect the actual deployment commit, build logs and project settings.
These checks must not be inferred from the successful local build.

Official references: [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json),
[Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
and [environment variables](https://vercel.com/docs/environment-variables).
