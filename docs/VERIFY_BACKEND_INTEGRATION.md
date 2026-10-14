# Real backend integration kaise check karein

Frontend: `cobuddy-frontend/`, environment: `cobuddy-frontend/.env.local`.
Backend: `cobuddy-backend/`, environment: `cobuddy-backend/.env`.

## 1. Local services chalayein

Repository root `D:\CoBuddy-Admin` mein PostgreSQL/Redis start karein:

```powershell
npm --prefix cobuddy-backend run docker:up
```

Do alag terminals mein:

```powershell
npm run dev:backend
```

```powershell
npm run dev:frontend
```

Already running service ko dobara start na karein. Frontend `http://localhost:3000` par hai. Backend ka default port `4000` hai; actual frontend API host `cobuddy-frontend/.env.local` ke `NEXT_PUBLIC_API_URL` se aata hai aur backend ke `PORT` se match hona chahiye. 11 October ke current local checkout mein frontend `http://localhost:4001/api` use kar raha hai. Environment badalne ke baad frontend restart karein. Backend secrets frontend environment mein copy na karein.

Apne `NEXT_PUBLIC_API_URL` ke end mein `/health` lagakar PostgreSQL aur Redis connectivity check karein (current local config: `http://localhost:4001/api/health`). Health success sirf services ki connectivity batata hai; next steps actual frontend integration verify karte hain.

## 2. Browser mein actual API request dekhein

1. Existing admin credentials se login karein.
2. DevTools > **Network** > **Fetch/XHR** kholein. Purana `auth` ya doosra filter hata kar `/api/companion-applications` filter karein.
3. Companion Applications page par **Refresh** button click karein. Yeh fresh API request bhejta hai, even when React Query has a recently cached response.
4. `/api/companion-applications?page=1&pageSize=100` request select karein. **Request URL** configured backend host par hona chahiye (current checkout: `localhost:4001`), aur **Status Code** `200`.
5. **Request Headers** mein `Authorization: Bearer ...` aur **Response** mein server data dekhein. Tokens copy/share karne ki zaroorat nahi hai.

`localhost:3000/companion-applications?_rsc=...` aur `text/x-component` Next.js page navigation/prefetch responses hain. Unka `200` business API ka result nahi hai. Protected API URL ko address bar mein kholne par Axios ka Bearer header nahi jata; verification website ke Network requests se karein.

Empty database par page **No applications yet** dikhata hai. Agar selected status mein records nahi hain lekin doosre statuses mein hain, **Show all applications** se unhe dekhein. Backend failure ko successful empty state nahi dikhaya jata.

Cleanup ke baad empty response/list expected hai. Empty list mein purane Jane Doe/Test Customer records nahi dikhne chahiye. `401` ka matlab login/session check karein; `403` ka matlab role/city permissions; connection refused ka matlab backend start nahi hai. Error ko success/empty data samajhkar ignore na karein.

## 3. Save aur reload se persistence verify karein

**Discovery > Events > Create Event** mein apna intended event save karein. Network mein `POST /api/discovery/events` ki successful response aur returned ID dekhein. Page reload karein: wahi ID/title `GET` response aur screen mein rehna chahiye.

Database se independently confirm karna ho:

```powershell
npm --prefix cobuddy-backend run prisma:studio
```

Studio mein `SpecialEvent` table mein wahi ID dekhein. Frontend screen, API response aur database ID match hona actual integration ka proof hai. Sirf frontend par success toast dikhna enough nahi hai.

## 4. Automated real-browser check

Manual data add nahi karna ho to local integration test temporary, uniquely named records banata hai aur `finally` cleanup mein remove karta hai. Is test mein HTTP responses mock nahi hote.

PostgreSQL/Redis running rehne dein. Test apna API free port par start karta hai; normal backend stop karne ki zaroorat nahi hai. Preview port `3108` free rakhein, aur test ke saath koi doosra frontend production build na chalayein. Root se:

```powershell
npm run build:backend
npm run test:live
```

Test frontend ko isolated API URL ke saath build karta hai. Real login/JWT, event save/reload, application assignment/waitlist, trust-rule save and API restart, and exact trust-score override/reload verify hote hain. Screenshots `cobuddy-frontend/test-results/audit-repair/` mein milenge. Cleanup ke baad normal environment ke saath frontend build restore hota hai; normal `.env` files edit nahi hoti.

`npm run test:frontend` adapter/session regression tests hai. `npm run test:browser` controlled browser tests hai. Dono useful hain, lekin real backend proof ke liye `test:live` use karein.

## Cleanup performed on 2026-10-10

- PostgreSQL backup: `.local-backups/cobuddy-before-demo-cleanup-20261010.dump`.
- Removed 55 confirmed legacy demo records: 1 customer, 2 companions, 2 applications, 1 venue, 4 bookings, 3 verification cases, 2 reports, 2 reviews, 1 ban, 1 empty wallet, 1 trust-history entry, 1 session-audit entry, 26 verification-audit events, and 8 unused demo staff accounts.
- Preserved 2 active administrators, existing login sessions, administrative audit history, reference data and saved settings.
- Cleanup report: `test-results/mock-cleanup/cleanup.json` (local, ignored by Git).
- Runtime trust rules now persist in PostgreSQL `AppConfig` instead of five hardcoded in-memory rules. Existing rule records are never synthesized on startup.
- Missing rating, tax, escrow, risk, chat confidence, check-in, location and trust-breakdown measurements no longer show invented numbers. Unsupported chat retention no longer pretends to save a 30-day policy.
- Reference seed only initializes English; it does not recreate demo activity. Test fixtures under test directories are isolated from normal app data.

For a read-only inventory/dry run on a local database:

```powershell
npm --prefix cobuddy-backend run db:inventory-demo
npm --prefix cobuddy-backend run db:cleanup-demo
```

The cleanup script only applies with `--apply --backup <absolute-backup-path>`, refuses production/staging or remote databases, checks a local PostgreSQL custom-format backup, preserves active admin access, and aborts on unknown linked activity. No blanket database truncation is used.

Saved trust rules do not yet drive automatic event processing. Unsupported measurements are shown as unavailable; removing mock data does not create those upstream integrations.

## Verification results

11 October companion-specific live check: the running website on port `3000` logged in, navigated from Verification to Companion Applications, loaded the list from port `4001` with a Bearer token and HTTP `200`, assigned an application with HTTP `201`, and saved/reloaded its interview with HTTP `201`. The Refresh button made a new authenticated list request; status-filter and empty-database messages were verified. All temporary test staff/city/application records were removed. Local evidence: `cobuddy-frontend/test-results/companion-diagnostics/live-report.json` and `empty-applications.png`. The database contained zero applications before and after the disposable check.

Frontend and backend production builds, TypeScript checks, lint and formatting passed. The frontend suite passed 31 tests, the backend unit suite passed 455 tests, and the desktop/mobile browser suite passed 118 tests. The live browser test passed with real PostgreSQL/Redis: authenticated login, event save/reload, application assignment/waitlist, trust rule persistence across an API restart, and an exact score override from 61 to 86 followed by reload. Disposable test records were removed afterward.

The API smoke suite passed 420 checks across 299 operations, plus 22 dispute/analytics, 11 rate-limit, 21 administrative workflow and 4 application-assignment checks. The final read-only database check confirmed zero customers, companions, applications, bookings and other cleaned operational records, two retained administrators, and no leftover live-test fixtures. See `test-results/mock-cleanup/verification.json`.
