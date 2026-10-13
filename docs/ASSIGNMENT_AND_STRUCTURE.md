# Application assignment and folder separation

Completed on 10 October 2026.

Updated 12 October: [current backend module ownership](BACKEND_STRUCTURE.md).
Application lists now use server pagination and status filtering; legacy PENDING
and IN_REVIEW records are included with their canonical status groups. Older
applications are no longer hidden after the first 100 records.

## Assignment fix

The frontend previously sent `IN_REVIEW` to a status endpoint whose backend DTO
accepted `SCREENING`. It also discarded the stored reviewer when mapping responses.

- Added `POST /api/companion-applications/:id/assign-self`. It takes the staff ID
  from the verified JWT, enforces city access, atomically claims the application,
  rejects another reviewer's claim, and supports retry by the same reviewer.
- Both current `SUBMITTED` and legacy `PENDING` records work. Stored `SCREENING`
  maps to the frontend's `IN REVIEW` display. Assignments survive reloads.
- List/detail responses include city and reviewer labels. The frontend shows
  server error messages and no longer calls protected Master Data merely to render
  this application detail page.
- Waitlist decisions persist their notes and release the assignment for later
  review. Approval/rejection preserve rationale; section rejection details are
  included in the saved notes. Closed records cannot be claimed, and a status-only
  patch cannot bypass companion/wallet creation.
- Missing DOB, rate, background-check and profile fields display “Not provided”
  or “Not recorded”. The application schema does not collect those fields; no
  invented values or invalid dates are displayed.
- The review screen now uses a single-column layout on small screens.

## Interview scheduling

Interview scheduling is available in the review screen after assignment. The
reviewer selects an eligible interviewer, a future local date/time and an optional
HTTP(S) meeting link. The backend stores the UTC time, reviewer and link; fresh
detail reads restore them after reload. Failed writes retain the draft for retry.
Waitlisting clears the appointment, while final decisions retain its history.
Scheduling does not send an invitation. The additive database migration is
`20261011130000_application_interviews`; run `npm run prisma:migrate-deploy` from
`cobuddy-backend` before starting a deployed backend with these fields.

## Application folders and environments

`cobuddy-frontend/` contains all frontend source, assets, tests, scripts, Next.js
configuration, dependencies and lockfile. `cobuddy-backend/` retains server source,
Prisma, Docker, server tests, dependencies and its separate lockfile.

Environment files are independent:

- `cobuddy-frontend/.env.local`: browser configuration; template `.env.example` in
  the same folder. No database, Redis or JWT secrets belong here.
- `cobuddy-backend/.env`: server configuration and secrets; separate `.env.example`.

The existing environment files were moved/preserved, not reset. Both local env
files, both dependency trees and generated builds are ignored by Git. All 320
previously tracked frontend files were verified at their new paths. Existing
user changes and the earlier audit repairs were retained.

Root npm commands delegate to the applications. CI uses the frontend directory
and its lockfile. Next.js tracing/build roots, script paths, tests, README and
deployment instructions were updated. Start development from the root in two
terminals with `npm run dev:backend` and `npm run dev:frontend`.

## Verification

- Both builds, TypeScript, lint and formatting passed.
- 455 backend unit tests and 27 frontend contract/session tests passed.
- 118 desktop/mobile browser tests passed.
- 420 API smoke checks passed, with zero failures/skips across 299 operations.
- Real HTTP/PostgreSQL tests verified competing reviewers, city scope, idempotent
  assignment, persisted labels, waitlisting, rejection, approval and creation of
  exactly one companion/wallet.
- A separate actual browser test logged in to the real backend, assigned a
  temporary application, checked the saved staff ID/status in PostgreSQL,
  reloaded, and submitted a waitlist decision. It used no HTTP response fixtures.
  Temporary records were cleaned up; existing applications were not reassigned.

Smoke evidence: `test-results/assignment-repair/api-smoke.json`.
Browser screenshot: `cobuddy-frontend/test-results/audit-repair/live-assignment.png`.
These local artifacts are ignored by Git.

The frontend and backend were restarted for local use on ports 3000 and 4000.
Logs are in `.local-logs/frontend-assignment.*.log` and
`.local-logs/backend-assignment.*.log`.
