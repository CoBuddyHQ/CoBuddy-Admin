# CoBuddy Frontend ↔ Backend Integration Guide

Per [README.md](file:///d:/CoBuddy-Admin/README.md) → the rule is simple:
> "To connect a real backend, **replace the contents of a module's `api.ts` functions with real axios API calls** returning the exact same shapes already defined in that module's `types.ts`. **Nothing else in the module should need to change.**"

This document tells you exactly how to do that in 7 steps + gives concrete examples per module.

---

## Step 1: Environment Setup

Create `.env.local` (NOT committed) in frontend root:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000/api
# After deploying backend:
# NEXT_PUBLIC_API_URL=https://admin-api.cobuddy.in/api
```

Restart Next.js dev server after creating `.env.local`.

---

## Step 2: Fix the Axios Client

Open [src/lib/api/client.ts](file:///d:/CoBuddy-Admin/src/lib/api/client.ts) and replace with the production-ready version:

```typescript
// src/lib/api/client.ts
import axiosInstance from 'axios';
import type { AxiosError } from 'axios';

interface ApiErrorShape {
  success: false;
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
}

// 1. Base Axios instance
export const axios = axiosInstance.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true, // required for HTTP-only refresh cookie (if used)
  timeout: 30_000, // 30s
});

// 2. Request interceptor → attach JWT from localStorage
axios.interceptors.request.use((config) => {
  const accessToken = typeof window !== 'undefined'
    ? localStorage.getItem('admin_token')
    : null;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  // Correlation ID for tracing (optional but recommended)
  const corrId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `cid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  config.headers.set('X-Correlation-ID', corrId);

  return config;
});

// 3. Response interceptor → auto-refresh token on 401, unify errors
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

axios.interceptors.response.use(
  (res) => {
    // Unwrap { success, data, meta } envelope into data only.
    // Keep full envelope via res.config.getEnvelope if needed later.
    const body = res.data;
    if (body && typeof body === 'object' && 'success' in body) {
      if (body.success === false) {
        // Backend returned business error inside 200 — convert to throw
        const err: AxiosError<ApiErrorShape> = new AxiosError(
          body.error?.message || 'Request failed',
          'ERR_BAD_RESPONSE',
          res.config,
          res.request,
          { ...res, data: body } as any,
        );
        return Promise.reject(err);
      }
      // Success — attach meta to data for components that need pagination
      if (body.meta !== undefined) {
        Object.defineProperty(body.data, '__meta', { value: body.meta, enumerable: false });
      }
      res.data = body.data;
    }
    return res;
  },
  async (error: AxiosError<ApiErrorShape>) => {
    const originalRequest: any = error.config;

    // ---- Handle 401 → attempt refresh, retry once ----
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== 'undefined'
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve: (t) => {
            originalRequest.headers.Authorization = `Bearer ${t}`;
            resolve(axios(originalRequest));
          }, reject });
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('admin_refresh');
        if (!refreshToken) throw new Error('NO_REFRESH_TOKEN');

        // Hit backend refresh endpoint
        const refreshRes = await axiosInstance.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken }
        );
        const { accessToken: newAccess, refreshToken: newRefresh } = refreshRes.data.data;

        localStorage.setItem('admin_token', newAccess);
        if (newRefresh) localStorage.setItem('admin_refresh', newRefresh);

        processQueue(null, newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return axios(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Full logout
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refresh');
        // Use Zustand logout if available (imported lazily to avoid circular dep)
        try {
          const { useAuthStore } = await import('@/store/authStore');
          useAuthStore.getState().logout();
        } catch { /* ignore */ }
        if (typeof window !== 'undefined') {
          window.location.href = '/login?reason=session-expired';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // ---- Handle 403 missing role ----
    if (error.response?.status === 403 && typeof window !== 'undefined') {
      // Don't logout — just toast
      try {
        const { toast } = await import('sonner');
        toast.error('Access Denied', {
          description: error.response.data?.error?.message
            || 'You do not have permission to perform this action.',
          duration: 5000,
        });
      } catch { /* ignore */ }
    }

    return Promise.reject(error);
  },
);

/**
 * Helper to extract pagination meta if it was attached.
 * Usage:
 *   const data = await employeesApi.getEmployees();
 *   const meta = getPaginationMeta(data);
 */
export function getPaginationMeta(data: any): {
  page: number; limit: number; total: number; totalPages: number;
  hasNextPage: boolean; hasPrevPage: boolean;
} | null {
  // @ts-expect-error non-enumerable attached
  return data?.__meta ?? null;
}

/**
 * Helper to extract friendly error message from Axios errors for UI toasts.
 */
export function extractErrorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  const ae = err as AxiosError<ApiErrorShape>;
  const msg = ae.response?.data?.error?.message;
  return typeof msg === 'string' ? msg : (ae.message || fallback);
}

export default axios;
```

### Helper Exports

Create `src/lib/api/helpers.ts` if needed for re-use across modules.

---

## Step 3: Fix Login Flow (Auth Store)

Update `useAuthStore` and the Login page to use real tokens:

### 3a. Update [login/page.tsx](file:///d:/CoBuddy-Admin/src/app/login/page.tsx)

Replace `handleCredentialsSubmit` and `handle2FASubmit`. Keep rest of UI same:

```typescript
import axios from '@/lib/api/client';

// Inside LoginPage component...
const handleCredentialsSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  try {
    const res = await axios.post('/auth/login', { email, password });
    const payload = res as any;

    // 2FA required case (backend returns 200 + requires2fa:true + mfaToken)
    if (payload?.requires2fa) {
      sessionStorage.setItem('mfa_token', payload.mfaToken);
      setPendingUser(payload.pendingUser);
      setStep('2FA');
      return;
    }

    // Direct login (2FA disabled)
    const { accessToken, refreshToken, user } = payload as any;
    localStorage.setItem('admin_token', accessToken);
    if (refreshToken) localStorage.setItem('admin_refresh', refreshToken);
    login(user);
    router.replace('/');
  } catch (err: any) {
    if (err?.response?.status === 403) {
      const code = err.response.data?.error?.code;
      if (code === 'ACCOUNT_SUSPENDED') {
        setError('This account has been suspended. Contact your administrator.');
        return;
      }
      if (code === 'TWO_FACTOR_REQUIRED') {
        // Alternative approach — backend signalled via error
        const { mfaToken, pendingUser } = err.response.data.error as any;
        sessionStorage.setItem('mfa_token', mfaToken);
        setPendingUser(pendingUser);
        setStep('2FA');
        return;
      }
    }
    setError(err?.response?.data?.error?.message || 'Invalid email or password');
  }
};

const handle2FASubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  if (otp.length !== 6) { setError('Please enter a 6-digit code'); return; }
  try {
    const mfaToken = sessionStorage.getItem('mfa_token');
    const res = await axios.post('/auth/verify-2fa', { mfaToken, otp });
    const { accessToken, refreshToken, user } = res as any;
    localStorage.setItem('admin_token', accessToken);
    if (refreshToken) localStorage.setItem('admin_refresh', refreshToken);
    sessionStorage.removeItem('mfa_token');
    login(user);
    router.replace('/');
  } catch (err: any) {
    setError(err?.response?.data?.error?.message || 'Invalid authentication code');
  }
};

// Remove the old finalizeLogin mock calls to employeeApi — they happen on backend now
```

### 3b. Update [authStore.ts](file:///d:/CoBuddy-Admin/src/store/authStore.ts)

Add real logout call:

```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: async () => {
        // Best effort — notify backend to invalidate refresh
        try {
          const refreshToken = localStorage.getItem('admin_refresh');
          if (refreshToken) {
            await axios.post('/auth/logout', { refreshToken });
          }
        } catch { /* ignore */ }
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refresh');
        set({ user: null, isAuthenticated: false });
      },
      hasRole: (role) => {
        const user = get().user;
        return user ? user.roles.includes(role) : false;
      }
    }),
    { name: 'auth-storage' }
  )
);
```

---

## Step 4: Replace Module `api.ts` Files — One-by-One Pattern

For every module in `src/modules/<area>/<module>/api.ts`, follow this **exact pattern**.
Return shape MUST match the `types.ts` exactly. **DO NOT change component/hook code.**

### Template: Before vs After

**BEFORE (mock)** — always looks like:
```typescript
export const employeesApi = {
  getEmployees: async (): Promise<Employee[]> => Promise.resolve([...mockEmployees]),
  addEmployee: async (data: AddEmployeePayload): Promise<Employee> => { ... },
};
```

**AFTER (real backend)** — use axios, paginated queries, return same types:

```typescript
// src/modules/system/employees/api.ts
import axios from '@/lib/api/client';
import { Employee, AddEmployeePayload, UpdateEmployeeRolesPayload } from './types';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export const employeesApi = {
  /** GET /api/employees — paginated list */
  getEmployees: async (params: PaginationParams = {}): Promise<Employee[]> => {
    const { data } = await axios.get<Employee[]>('/employees', { params });
    return data; // axios interceptor unwraps { success, data, meta } already
  },

  /** GET /api/employees/:id */
  getEmployee: async (id: string): Promise<Employee> => {
    const { data } = await axios.get<Employee>(`/employees/${id}`);
    return data;
  },

  /** POST /api/employees */
  addEmployee: async (data: AddEmployeePayload): Promise<Employee> => {
    const res = await axios.post<Employee>('/employees', data);
    return res.data;
  },

  /** PATCH /api/employees/:id/roles */
  updateRoles: async (id: string, payload: UpdateEmployeeRolesPayload): Promise<Employee> => {
    const { data } = await axios.patch<Employee>(`/employees/${id}/roles`, payload);
    return data;
  },

  /** PATCH /api/employees/:id/status */
  toggleStatus: async (id: string, _currentStatus: string): Promise<Employee> => {
    const { data } = await axios.patch<Employee>(`/employees/${id}/status`);
    return data;
  },

  /** POST /api/employees/:id/resend-invite */
  resendInvite: async (id: string): Promise<void> => {
    await axios.post(`/employees/${id}/resend-invite`);
  },

  /** POST /api/employees/:id/force-logout */
  forceLogout: async (id: string): Promise<void> => {
    await axios.post(`/employees/${id}/force-logout`);
  },

  /** INTERNAL: backend handles updateLastLogin automatically on login — keep no-op for compat */
  updateLastLogin: async (_id: string): Promise<void> => { /* no-op */ },
};
```

### Important Pattern Rules
1. **Import axios** from `@/lib/api/client` (not the default one with interceptors disabled!)
2. **Keep function signatures identical** to mock (`params`) — hooks like `useEmployees` call these exact names
3. **Return types identical** to frontend types — backend schema (Prisma) already matches
4. For list endpoints, the interceptor attaches `__meta` (non-enumerable). Access it via `getPaginationMeta(data)` exported from client.ts

---

## Step 5: Per-Module Integration Checklist

Use this list to track progress. Work order matches **Phase 1 → Phase 8** of roadmap.

### Phase 1: Foundation (Week 1 — wire these first)
| # | Module Path | Frontend File(s) | Backend Section Ref | Status |
|---|---|---|---|---|
| 1 | Auth (login) | `app/login/page.tsx` + `store/authStore.ts` | 03: Section 1 | ✅ Step 3 covers |
| 2 | Employees | `modules/system/employees/api.ts` (7 methods) | 03: Section 2 | ⬜ |
| 3 | Audit Logs | `modules/system/audit-logs/api.ts` (2 methods) | 03: Section 3 | ⬜ |
| 4 | Master Data | `modules/system/master-data/api.ts` (18 toggles + 18 adds + cities/areas + defaults + bundle) | 03: Section 4 | ⬜ |
| 5 | System Config | `modules/system/config/api.ts` + `modules/system/app-configs/api.ts` | 03: Section 5 | ⬜ |

**After Phase 1 wired, you can login, manage staff, and manage master data — first full E2E tests.**

### Phase 2: Users (Week 2)
| # | Module Path | Frontend File | Backend Section |
|---|---|---|---|
| 6 | Customers | `modules/customers/api.ts` (6 methods, incl. booking & transaction history) | 03: Section 6 |
| 7 | Companions | `modules/companions/api.ts` (7 methods incl. earnings breakdown) | 03: Section 7 |
| 8 | Companion Applications | `modules/companion-applications/api.ts` | 03: Section 8 |

### Phase 3: Verification & Moderation (Week 3)
| # | Module Path | Frontend File | Backend Section |
|---|---|---|---|
| 9 | Verification Queue + Thresholds | `modules/verification/api.ts` (4 methods) | 03: Section 9 |
| 10 | Trust Score Engine | `modules/trust-score/api.ts` | 03: Section 9 |
| 11 | Reports | `modules/moderation/reports/api.ts` (5 methods) | 03: Section 10 |
| 12 | Bans | `modules/moderation/bans/api.ts` | 03: Section 10 |
| 13 | Flagged Chats + Chat Settings | `modules/moderation/flagged-chats/api.ts`, `chat-settings/api.ts` | 03: Section 10 |
| 14 | Risk Scoring | `modules/moderation/risk-scoring/api.ts` | 03: Section 10 |
| 15 | Reviews Moderation | `modules/moderation/reviews/api.ts` | 03: Section 10 |
| 16 | Appeals | `modules/moderation/appeals/api.ts` | 03: Section 10 |

### Phase 4: Safety & Operations (Week 4)
| # | Module Path | Frontend File | Backend Section |
|---|---|---|---|
| 17 | SOS Dashboard | `modules/safety/sos-dashboard/api.ts` + Sockets | 03: Section 11 + 20 |
| 18 | Geofence Alerts | `modules/safety/geofence/api.ts` | 03: Section 11 |
| 19 | Incidents | `modules/safety/incidents/api.ts` (6 methods) | 03: Section 11 |
| 20 | Age Escalations | `modules/safety/age-escalation/api.ts` | 03: Section 11 |
| 21 | Emergency Workflow | `modules/safety/emergency-workflow/api.ts` | 03: Section 11 |
| 22 | Live Sessions (Safety) | `modules/safety/live-sessions/api.ts` | 03: Section 11 |
| 23 | Live Map | `modules/operations/live-map/api.ts` + Socket `live-map:*` | 03: Sections 12 + 20 |
| 24 | Active Sessions | `modules/operations/active-sessions/api.ts` (1 method) | 03: Section 12 |
| 25 | Completed Bookings | `modules/operations/completed-bookings/api.ts` | 03: Section 12 |
| 26 | Cancelled Bookings | `modules/operations/cancelled-bookings/api.ts` | 03: Section 12 |
| 27 | Session Audit | `modules/operations/session-audit/api.ts` | 03: Section 12 |
| 28 | Matchmaking Config | `modules/operations/matchmaking/api.ts` | 03: Section 12 |
| 29 | City Launch | `modules/operations/city-launch/api.ts` | 03: Section 12 |
| 30 | Venues | `modules/operations/venues/api.ts` | 03: Section 12 |
| 31 | Growth Abuse | `modules/operations/growth-abuse/api.ts` | 03: Section 12 |
| 32 | Booking Disputes | `modules/bookings/disputes/api.ts` | 03: Section 12 |

### Phase 5: Financial (Week 5)
| # | Module Path | Frontend File | Backend Section |
|---|---|---|---|
| 33 | Wallets / Escrow | `modules/financial/escrow/api.ts` | 03: Section 13 |
| 34 | Payouts | `modules/financial/payouts/api.ts` (3 methods) | 03: Section 13 |
| 35 | Refunds | `modules/financial/refunds/api.ts` | 03: Section 13 |
| 36 | Fraud Detection | `modules/financial/fraud-detection/api.ts` | 03: Section 13 |
| 37 | Tax Invoices | `modules/financial/tax-invoices/api.ts` | 03: Section 13 |
| 38 | Revenue Reports | `modules/financial/revenue-reports/api.ts` + Analytics | 03: Section 13 + 19 |
| 39 | Reconciliation | `modules/financial/reconciliation/api.ts` | 03: Section 13 |

### Phase 6: Support + Discovery + Legal (Week 6)
| # | Module Path | Frontend File | Backend Section |
|---|---|---|---|
| 40 | Support Tickets | `modules/support/tickets/api.ts` (8 methods incl. reply/assign/escalate) | 03: Section 14 |
| 41 | SLA Dashboard | `modules/support/sla-dashboard/api.ts` | 03: Section 14 |
| 42 | Discovery / Ranking Config | `modules/discovery/ranking-config/api.ts` | 03: Section 15 |
| 43 | Special Events | `modules/discovery/events/api.ts` | 03: Section 15 |
| 44 | Data Privacy (DSAR) | `modules/legal/data-privacy/api.ts` | 03: Section 17 |
| 45 | Legal Requests | `modules/legal/legal-requests/api.ts` | 03: Section 17 |

### Phase 7: Marketing + Platform + Analytics + Notifications (Week 7)
| # | Module Path | Frontend File | Backend Section |
|---|---|---|---|
| 46 | Notifications / Announcements | `modules/marketing/notifications/api.ts` | 03: Section 16, 18 |
| 47 | Referrals | `modules/marketing/referrals/api.ts` | 03: Section 16 |
| 48 | Policy Docs | `modules/platform-config/policy-docs/api.ts` | 03: Section 16 |
| 49 | Training Content | `modules/platform-config/training/api.ts` | 03: Section 16 |
| 50 | Safety Analytics | `modules/analytics/safety` | 03: Section 19 |
| 51 | Financial Analytics | `modules/analytics/financial` | 03: Section 19 |
| 52 | Operational Analytics | `modules/analytics/operational` | 03: Section 19 |
| 53 | Growth Analytics | `modules/analytics/growth/api.ts` (1 method) | 03: Section 19 |
| 54 | Staff Notifications Inbox | `modules/system/staff-notifications/api.ts` + Socket `staff:notification` | 03: Section 16 |

---

## Step 6: Wire Real-time (Socket.io) Features

Live Map, SOS, Notifications need Socket.io.

### 6a. Install Socket.io Client on Frontend
```bash
npm install socket.io-client
```

### 6b. Add Provider: `src/components/providers/SocketProvider.tsx`

```tsx
'use client';
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface SocketCtx {
  socket: Socket | null;
  connected: boolean;
  subscribeToCityMap: (cityIds: string[]) => void;
  unsubscribeFromCityMap: () => void;
}

const SocketContext = createContext<SocketCtx | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }
    // Connect with JWT auth
    const access = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    const socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      transports: ['websocket'],
      auth: { token: access },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // In-app notifications (toast)
    socket.on('staff:notification', (payload: any) => {
      const { notification } = payload;
      toast.info(notification.title, { description: notification.body, duration: 8000 });
    });

    // SOS push — loud toast + play alert sound (safety module)
    socket.on('sos:new', (payload: any) => {
      toast.error(`🚨 SOS Alert #${payload.sosAlert.alertRef}`, {
        description: 'Tap Safety → SOS Dashboard to respond.',
        duration: 15000,
        action: {
          label: 'Open',
          onClick: () => window.location.href = '/safety/sos-dashboard',
        },
      });
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [isAuthenticated, user?.id]);

  const subscribeToCityMap = (cityIds: string[]) => {
    socketRef.current?.emit('live-map:subscribe', { cityIds });
  };
  const unsubscribeFromCityMap = () => {
    socketRef.current?.emit('live-map:subscribe', { cityIds: [] });
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, subscribeToCityMap, unsubscribeFromCityMap }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
```

### 6c. Inject SocketProvider in root layout

Open [src/app/layout.tsx](file:///d:/CoBuddy-Admin/src/app/layout.tsx) (or [src/app/(dashboard)/layout.tsx](file:///d:/CoBuddy-Admin/src/app/(dashboard)/layout.tsx)) and wrap children.

---

## Step 7: Error Handling in UI (Toast Feedback)

For all mutations (POST/PUT/PATCH/DELETE), wrap with sonner toast feedback. Use the `extractErrorMessage` helper from client.ts.

Pattern for hooks like `useEmployees.ts`:

```typescript
// src/modules/system/employees/hooks/useEmployees.ts — example
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { employeesApi } from '../api';
import { extractErrorMessage } from '@/lib/api/client';
import type { AddEmployeePayload, UpdateEmployeeRolesPayload } from '../types';

const QUERY_KEY = ['employees'];

export function useEmployees(params = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => employeesApi.getEmployees(params),
  });
}

export function useAddEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddEmployeePayload) => employeesApi.addEmployee(payload),
    onSuccess: (emp) => {
      toast.success('Employee added', { description: `Invite sent to ${emp.email}` });
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err) => {
      toast.error('Failed to add employee', { description: extractErrorMessage(err) });
    },
  });
}

export function useUpdateEmployeeRoles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEmployeeRolesPayload }) =>
      employeesApi.updateRoles(id, payload),
    onSuccess: () => {
      toast.success('Roles updated');
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err) => toast.error('Update failed', { description: extractErrorMessage(err) }),
  });
}

// Similar for toggleStatus, resendInvite, forceLogout...
```

---

## Step 8: Upload File Flow (Presigned S3 URLs)

For KYC uploads (verification), evidence uploads (reports/incidents/tickets), use the presigned flow. Do NOT send file bytes to Node backend.

```typescript
// src/lib/api/uploads.ts
import axios from '@/lib/api/client';

type UploadPurpose =
  | 'KYC_ID' | 'KYC_SELFIE' | 'KYC_DECLARATION'
  | 'REPORT_EVIDENCE' | 'INCIDENT_EVIDENCE'
  | 'TICKET_ATTACHMENT' | 'PROFILE_PIC' | 'TRAINING' | 'POLICY_PDF';

export interface PresignResult {
  fileId: string;
  uploadUrl: string;  // PUT directly here (S3 presigned)
  downloadUrl: string; // Reference URL to save on entity (needs permission check to actually download)
}

export async function presignUpload(opts: {
  fileName: string;
  contentType: string;
  purpose: UploadPurpose;
  entityId?: string;
}): Promise<PresignResult> {
  const { data } = await axios.post<PresignResult>('/uploads/presign', opts);
  return data;
}

export async function uploadToS3(uploadUrl: string, file: File) {
  await axios.put(uploadUrl, file, {
    headers: { 'Content-Type': file.type },
    withCredentials: false, // Important! S3 does not want auth cookies
  });
}

export async function confirmUpload(fileId: string, metadata?: Record<string, any>) {
  const { data } = await axios.post(`/uploads/${fileId}/confirm`, { metadata });
  return data;
}

// Convenience — upload single file end-to-end:
export async function uploadFile(file: File, purpose: UploadPurpose, entityId?: string) {
  const { fileId, uploadUrl } = await presignUpload({
    fileName: file.name,
    contentType: file.type,
    purpose,
    entityId,
  });
  await uploadToS3(uploadUrl, file);
  await confirmUpload(fileId, { originalName: file.name, size: file.size });
  return fileId;
}
```

### Example usage in Evidence upload modal
```typescript
const handleFiles = async (files: File[]) => {
  for (const f of files) {
    const id = await uploadFile(f, 'INCIDENT_EVIDENCE', incidentId);
    // add evidenceUrls entry via PATCH /incidents/:id
  }
};
```

---

## Step 9: Testing Checklist Per Module Integrated

After replacing each `api.ts`, **verify all CRUD operations work via UI manually**:

1. ⬜ **List page loads** — rows render, search works, filters work, pagination works
2. ⬜ **Detail page loads** — clicking a row opens detail (e.g., `/customers/:id`, `/companions/:id`)
3. ⬜ **Create / Add** — add new entity → success toast → list updates → DB row exists
4. ⬜ **Edit / Update status** — actions mutate state → audit log entry created
5. ⬜ **Delete / Suspend / Ban** → status changes, row still visible in list with new status
6. ⬜ **403 Role Enforcement**: Login as MODERATOR and try Employees page → menu item hidden (via permissions guard). Direct URL `/system/employees` → API returns 403, UI redirects to dashboard.
7. ⬜ **Session Expiry**: Delete `admin_token` → next API call silently refreshes → no errors. Delete `admin_refresh` too → redirected to `/login`.
8. ⬜ **City Scope**: Login as CITY_OPS (city scope = CITY-1 Mumbai) → go to Bookings → only bookings from Mumbai appear.

---

## Step 10: Feature Flag Gradual Rollout (Optional but Professional)

Add `isIntegrated: Record<string, boolean>` to UiStore. Default to `false` per module. Enables you to ship partial integration without breaking pages (falls back to mock data).

Pattern:
```typescript
// employees/api.ts — hybrid loader based on feature flag
import { useUiStore } from '@/store/uiStore';
import { /* mock functions */ } from './_mock-api'; // move old mock to separate file

const getImpl = () => (useUiStore.getState().backendIntegrated.employees ? employeesBackendApi : mockEmployeesApi);

export const employeesApi = new Proxy(employeesBackendApi, {
  get(target, prop) {
    const impl = getImpl();
    return (impl as any)[prop];
  },
});
```

---

## Common Pitfalls & Gotchas

### ❌ Changing types in `types.ts`
Don't do it. If backend returns a different key name, map it on frontend inside api.ts.
```typescript
// BAD: Changing CompanionRecord interface in types.ts
// GOOD: Map inside api call
getCompanions: async () => {
  const { data } = await axios.get<any[]>('/companions');
  return data.map(row => ({
    id: row.id,
    name: row.name,
    // ... map snake_case backend to camelCase frontend
    trustScore: row.trust_score ?? row.trustScore,
  }));
};
```

### ❌ Exposing `.env` to server only — `NEXT_PUBLIC_` prefix
Any var accessible from client must start with `NEXT_PUBLIC_`. Otherwise it will be `undefined` in browser!

### ❌ Calling `queryClient.invalidateQueries` with wrong keys
Each list page with filters/params uses different query keys. Be specific: `qc.invalidateQueries({ queryKey: ['tickets'] })` works, but `qc.invalidateQueries()` resets everything and causes too much refetch.

### ❌ Missing `await` before navigation
After save, wait for mutation success → then router.push.

### ❌ Timestamps mismatch — backend returns ISO string
Dates in types.ts are typed `string` (ISO) — frontend formats with `formatDate` utility (date-fns). Keep as strings.

---

## Quickest Win — Verify Phase 1 in < 1 Hour

If you already built backend Phase 1:

1. Edit `.env.local` with API URL
2. Replace `client.ts` (Step 2)
3. Replace `login/page.tsx` (Step 3a)
4. Replace `authStore.ts` (Step 3b)
5. Replace `system/employees/api.ts` + `system/master-data/api.ts` + `system/audit-logs/api.ts`
6. Login with admin credentials → dashboard loads → Sidebar renders correct menu
7. Open Employees → list loads → Add Employee form works → submit → toast success → row appears

That's it — you are **end-to-end live** for the foundational modules. Then keep replacing one `api.ts` at a time.

---

## Next Document

Continue to **[06-ROADMAP.md](./06-ROADMAP.md)** for week-by-week execution roadmap, estimates, milestones, and the PR-by-PR sequence to follow.
