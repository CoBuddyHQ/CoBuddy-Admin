# CoBuddy frontend

This folder contains the complete Next.js admin application: `src/`, `public/`,
tests, frontend scripts, framework configuration and its own dependency lockfile.

Use Node.js 24. Install with `npm ci`. Copy `.env.example` to `.env.local` only
when no local file exists. `NEXT_PUBLIC_API_URL=http://localhost:4000/api` connects
to the sibling backend. Never put database, Redis, JWT or delivery-provider secrets
in frontend environment files; `NEXT_PUBLIC_*` values are browser-visible.

- `npm run dev`: frontend development server on port 3000.
- `npm run build`: standalone production build.
- `npm run preview`: serve the standalone build on port 3105 (override `PORT`).
- `npm run verify`: formatting, TypeScript, lint, contract tests and build.
- `npm run test:browser`: desktop/mobile browser regression tests after building.

Start the backend separately from `../cobuddy-backend`. See the repository
[README](../README.md) and [deployment guide](../DEPLOYMENT.md) for setup.
