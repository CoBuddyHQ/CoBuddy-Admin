# CoBuddy Platform — Formal API Contracts & Interface Specification

**Document Version:** 1.0.0-PROD  
**Status:** Verified Against Active NestJS Controllers & DTOs  
**Date:** October 2026  

---

## 1. Global Standards & Conventions

1. **Base Prefix:** All endpoints follow `/api/v1/*` or top-level health checks (`/health`).
2. **Data Format:** Requests and responses use `application/json; charset=utf-8`.
3. **Authentication Headers:**
   - **Client Authenticated:** `Authorization: Bearer <jwt_token>`
   - **S2S Mutual Authenticated:** `x-internal-token: <shared_s2s_secret>`
4. **Error Envelope:**
   ```json
   {
     "statusCode": 400,
     "message": "Detailed error message or array of validation errors",
     "error": "Bad Request",
     "timestamp": "2026-10-14T18:30:00.000Z",
     "path": "/api/v1/bookings"
   }
   ```

---

## 2. Customer Backend API Contracts (`Port 4002`)

### 2.1 Authentication & Profile
- `POST /api/v1/auth/send-otp`
  - **Auth:** Public
  - **Request Body:** `{ "phone": "+919876543210" }`
  - **Response 200:** `{ "success": true, "message": "OTP sent successfully" }`
- `POST /api/v1/auth/verify-otp`
  - **Auth:** Public
  - **Request Body:** `{ "phone": "+919876543210", "otp": "123456" }`
  - **Response 200:** `{ "accessToken": "eyJ...", "user": { "id": "...", "phone": "+919876543210", "name": "..." } }`
- `GET /api/v1/profile`
  - **Auth:** Customer Bearer Token
  - **Response 200:** Profile object including addresses, preferences, and verified status.

### 2.2 Discovery & Companion Exploration
- `GET /api/v1/discovery/companions`
  - **Auth:** Customer Bearer Token
  - **Query Params:** `city`, `interest`, `activity`, `page`, `limit`
  - **Backend Logic:** Proxies live S2S query to Companion Backend `GET /api/v1/companions/public`.
  - **Response 200:**
    ```json
    {
      "companions": [
        {
          "id": "comp_01J...",
          "name": "Priya Sharma",
          "city": "Bengaluru",
          "bio": "Art gallery enthusiast and cafe lover",
          "hourlyRate": 499,
          "rating": 4.9,
          "reviewCount": 24,
          "avatarUrl": "https://...",
          "photos": ["https://..."],
          "interests": ["Art", "Coffee", "Books"]
        }
      ],
      "total": 1,
      "page": 1
    }
    ```
  - **Failure 503:** Returned when Companion Backend is offline (zero mock data fallback).

### 2.3 Bookings & Pricing
- `POST /api/v1/bookings`
  - **Auth:** Customer Bearer Token
  - **Request Body:**
    ```json
    {
      "companionId": "comp_01J...",
      "activity": "Cafe Visit",
      "city": "Bengaluru",
      "startTime": "2026-10-15T10:00:00.000Z",
      "endTime": "2026-10-15T12:00:00.000Z",
      "meetingLocation": "Indiranagar 100ft Rd"
    }
    ```
  - **Server-Side Pricing Computation:**
    - Hours: `(endTime - startTime) / 3600000 = 2.0 hrs`
    - Base: `2 * 499 = ₹998`
    - Platform Fee (15%): `₹149.70`
    - GST (18% on fee): `₹26.95`
    - Total: `₹1174.65` (Client-supplied totals are strictly ignored).
  - **S2S Dispatch:** Calls Companion Backend `POST /api/v1/internal/companion/requests`.
  - **Response 201:** Booking record with generated 4-digit arrival passcode.

### 2.4 Internal S2S Booking Callback
- `POST /api/v1/internal/bookings/:id/status-update`
  - **Auth:** `x-internal-token` header required
  - **Request Body:**
    ```json
    {
      "status": "IN_PROGRESS",
      "reason": "Customer passcode verified at venue",
      "updatedAt": "2026-10-15T10:05:00.000Z"
    }
    ```
  - **Response 200:** `{ "success": true, "bookingId": ":id", "status": "IN_PROGRESS" }`
  - **Response 401:** If `x-internal-token` is missing or invalid.
  - **Response 404:** If booking `:id` does not exist.

---

## 3. Companion Backend API Contracts (`Port 4001`)

### 3.1 Authentication & Onboarding
- `POST /api/v1/auth/send-otp` & `POST /api/v1/auth/verify-otp`
  - **Auth:** Public
  - **Behavior:** Protected test-OTP allowlist and production bypass blocking.
- `GET /api/v1/profile` & `PUT /api/v1/profile`
  - **Auth:** Companion Bearer Token
  - **Payload:** Bio, languages, interests, hourly rate, notification settings.

### 3.2 Public Companion Catalog (Discovery Target)
- `GET /api/v1/companions/public`
  - **Auth:** Public or Internal S2S
  - **Query Params:** `city`, `activity`, `limit`, `offset`
  - **Data Sanitization:** Strips internal IDs, phone numbers, KYC documents, and earnings.
  - **Response 200:** Array of sanitized public companion profile cards.

### 3.3 Internal S2S Booking Request Ingestion
- `POST /api/v1/internal/companion/requests`
  - **Auth:** `x-internal-token` header required
  - **Request Body:**
    ```json
    {
      "bookingId": "book_01J...",
      "customerId": "cust_01J...",
      "companionId": "comp_01J...",
      "scheduledStartTime": "2026-10-15T10:00:00.000Z",
      "scheduledEndTime": "2026-10-15T12:00:00.000Z",
      "activity": "Cafe Visit",
      "city": "Bengaluru",
      "totalAmount": 1174.65
    }
    ```
  - **Availability Guard:** Verifies companion has no conflicting active bookings.
  - **Response 201:** `{ "success": true, "requestId": "req_...", "status": "PENDING" }`
  - **Response 409:** Concurrency conflict if companion is already booked.

### 3.4 Sessions & Arrival Verification
- `POST /api/v1/sessions/:id/verify-customer`
  - **Auth:** Companion Bearer Token
  - **Request Body:** `{ "passcode": "8492" }`
  - **Behavior:** Compares passcode against booking record. On match, triggers S2S callback `POST /api/v1/internal/bookings/:bookingId/status-update` with `status: "IN_PROGRESS"`.
  - **Response 200:** `{ "verified": true, "status": "IN_PROGRESS", "startedAt": "..." }`
- `POST /api/v1/sessions/:id/complete`
  - **Auth:** Companion Bearer Token
  - **Behavior:** Records session end time, triggers S2S completion callback, and credits companion ledger.
  - **Response 200:** `{ "status": "COMPLETED", "earnedAmount": 998.00 }`

---

## 4. Admin Backend API Contracts (`Port 4000`)

### 4.1 Staff Authentication & Administration
- `POST /api/v1/auth/login`
  - **Auth:** Public (Staff credentials)
  - **Request Body:** `{ "email": "admin@cobuddy.com", "password": "[SECRET]" }`
  - **Response 200:** Returns `{ "accessToken": "...", "staff": { "id": "...", "role": "SUPERADMIN", "permissions": [...] } }` plus HttpOnly refresh cookie.
- `GET /api/v1/auth/me`
  - **Auth:** Staff Bearer Token / Cookie
  - **Response 200:** Verified staff profile, roles, and allowed cities.

### 4.2 Companion Application & KYC Verification
- `GET /api/v1/verification/applications`
  - **Auth:** Staff Bearer Token (`COMPANION_READ`)
  - **Query Params:** `status`, `city`, `page`, `limit`
- `PUT /api/v1/verification/applications/:id/decision`
  - **Auth:** Staff Bearer Token (`COMPANION_VERIFY`)
  - **Request Body:** `{ "decision": "APPROVED", "notes": "Aadhaar and Police verification verified" }`
  - **Audit Trail:** Injects staff ID and timestamp into immutable `AuditLog`.

### 4.3 Marketing Campaigns & Announcements
- `GET /api/v1/marketing/announcements`
  - **Auth:** Staff Bearer Token (`MARKETING_READ`)
- `POST /api/v1/marketing/announcements`
  - **Auth:** Staff Bearer Token (`MARKETING_WRITE`)
  - **Request Body:**
    ```json
    {
      "title": "Diwali Weekend Festival",
      "content": "Book companion activities this festive weekend and get 20% cashback in your wallet!",
      "targetAudience": "CUSTOMERS",
      "city": "Bengaluru",
      "status": "PUBLISHED",
      "validFrom": "2026-10-15T00:00:00.000Z",
      "validUntil": "2026-10-20T23:59:59.000Z"
    }
    ```
- `GET /api/v1/marketing/announcements/active`
  - **Auth:** Public / Customer App
  - **Filtering:** Returns only announcements with `status: "PUBLISHED"` and current date within `[validFrom, validUntil]`. Unpublished drafts are strictly excluded.

### 4.4 Trust & Safety SOS Incidents
- `GET /api/v1/safety/sos/alerts`
  - **Auth:** Staff Bearer Token (`SAFETY_READ`)
  - **Response 200:** List of real open emergency alerts, GPS locations, and contact dispatch logs.
- `POST /api/v1/safety/sos/:id/escalate`
  - **Auth:** Staff Bearer Token (`SAFETY_WRITE`)
  - **Request Body:** `{ "action": "CONTACTED_LOCAL_AUTHORITIES", "policeStation": "Koramangala Station", "officerName": "Inspector Rao" }`

---

*Certified accurate according to active TypeScript controller implementations.*
