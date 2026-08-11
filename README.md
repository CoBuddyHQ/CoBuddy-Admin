# CoBuddy Admin Panel

This project is the CoBuddy Admin Panel, currently functioning as a 100% complete **mock-data frontend prototype** covering all 42 specification modules.

## Module Structure Convention

Every feature lives under `src/modules/{area}/{module}/` and generally contains:
- `types.ts`: Data shapes and interfaces.
- `api.ts`: Currently mock/in-memory, meant to be swapped for real API calls.
- `hooks/`: React Query hooks that the components actually use.

The corresponding Next.js page lives at `src/app/(dashboard)/{route}/page.tsx`.

## Backend Integration Guide

To connect a real backend, **replace the contents of a module's `api.ts` functions with real `fetch` or API calls** returning the exact same shapes already defined in that module's `types.ts`.
- **Nothing else in the module should need to change.** The frontend state, components, and workflows are already wired correctly.
- **Shared Master Data**: Data that is cross-module (like Cities, Interests, App Languages, Spoken Languages) lives in `system/master-data`. Since many other modules read from this, it is recommended to wire this up early.

## Development

Standard commands for this project:

```bash
# Install dependencies (use legacy-peer-deps due to @tremor/react React 19 conflict)
npm install --legacy-peer-deps

# Run the development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## Progress History

See `PROGRESS_LOG.md` for the full history of what has been built and verified across all prior rounds of development.
