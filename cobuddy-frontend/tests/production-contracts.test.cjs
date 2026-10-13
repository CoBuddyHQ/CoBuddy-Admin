const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(relativePath, imports = {}) {
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  vm.runInNewContext(compiled, {
    exports,
    process,
    require: (name) => {
      if (!(name in imports)) throw new Error('Unexpected import: ' + name);
      return imports[name];
    },
  });
  return exports;
}

test('application assignment uses server identity and maps canonical statuses, reviewer and city', async () => {
  const calls = [];
  const item = {
    id: 'app/1',
    firstName: 'Test',
    lastName: 'Applicant',
    phone: 'fixture',
    cityId: 'city-id',
    city: { name: { en: 'Pune' } },
    applicationStatus: 'SCREENING',
    reviewedByStaffId: 'staff-id',
    reviewedBy: { id: 'staff-id', name: 'Reviewer' },
    createdAt: '2026-10-10T00:00:00Z',
    portfolioUrls: [],
  };
  const { companionAppApi } = load('src/modules/companion-applications/api.ts', {
    '@/lib/api/client': {
      post: async (url, body) => {
        calls.push({ url, body });
        return { data: { data: item } };
      },
      patch: async (url, body) => {
        calls.push({ url, body });
        return { data: { data: { ...item, applicationStatus: 'WAITLISTED' } } };
      },
    },
  });
  const assigned = await companionAppApi.assignApplication('app/1');
  assert.equal(calls[0].url, '/companion-applications/app%2F1/assign-self');
  assert.equal(calls[0].body, undefined);
  assert.equal(assigned.status, 'IN_REVIEW');
  assert.equal(assigned.assignedToId, 'staff-id');
  assert.equal(assigned.assignedTo, 'Reviewer');
  assert.equal(assigned.city, 'Pune');
  assert.equal(assigned.dateOfBirth, null);
  assert.equal(assigned.backgroundCheckStatus, null);
  const waitlisted = await companionAppApi.submitDecision({
    id: 'app/1',
    decision: 'WAITLIST',
    notes: 'Review later',
  });
  assert.equal(waitlisted.status, 'WAITLISTED');
  assert.equal(calls[1].body.reviewNotes, 'Review later');
  await companionAppApi.submitDecision({
    id: 'app/1',
    decision: 'REJECT',
    notes: 'Needs changes',
    sectionRejectReasons: { photos: 'Blurry photo' },
  });
  assert.equal(calls[2].body.reason, 'Needs changes\n[photos] Blurry photo');
});

test('applications request server status filters and preserve pages beyond the first hundred records', async () => {
  const calls = [];
  const meta = {
    page: 6,
    pageSize: 20,
    totalItems: 121,
    totalPages: 7,
    hasNext: true,
    hasPrevious: true,
  };
  const { companionAppApi } = load('src/modules/companion-applications/api.ts', {
    '@/lib/api/client': {
      get: async (url, config) => {
        calls.push({ url, ...config.params });
        return { data: { data: [], meta } };
      },
    },
  });
  const result = await companionAppApi.getApplications('PENDING', 6);
  assert.equal(result.meta, meta);
  assert.equal(calls[0].page, 6);
  assert.equal(calls[0].status, 'SUBMITTED');
  await companionAppApi.getApplications('IN_REVIEW');
  assert.equal(calls[1].status, 'SCREENING');
  await companionAppApi.getApplications('ALL');
  assert.equal(calls[2].status, undefined);
});

test('safety analytics reads one server aggregate instead of counting paginated records', async () => {
  const calls = [];
  const metrics = {
    activeRestrictions: 8,
    repeatOffenders: 2,
    repeatOffenderRate: 25,
    fraudHits: 4,
    spoofHits: 1,
    totalAgeEscalations: 3,
    resolvedAgeEscalations: 2,
    ageResolutionRate: 66.7,
    measuredAt: '2026-10-11T00:00:00.000Z',
  };
  const { safetyAnalyticsApi } = load('src/modules/analytics/safety/api.ts', {
    '@/lib/api/client': {
      get: async (url) => {
        calls.push(url);
        return { data: { data: metrics } };
      },
    },
  });

  assert.deepEqual(await safetyAnalyticsApi.getMetrics(), metrics);
  assert.deepEqual(calls, ['/analytics/safety']);
});

test('disputes use one authorized endpoint and preserve structured state and refund details', async () => {
  const requests = [];
  const { disputesApi } = load('src/modules/bookings/disputes/api.ts', {
    '@/lib/api/client': {
      get: async (url) => {
        requests.push(url);
        return {
          data: {
            data: [
              {
                id: 'd/1',
                version: 3,
                workflowStatus: 'ESCALATED',
                overridePercent: 25,
                overrideReason: 'Reviewed evidence',
                refundAmount: '25.01',
                booking: { bookingRef: 'B-1', bookingAmount: '100.03' },
              },
            ],
          },
        };
      },
      patch: async (url, body) => requests.push({ url, body }),
      post: async (url, body) => requests.push({ url, body }),
    },
  });
  const disputes = await disputesApi.getDisputes();
  assert.equal(requests.length, 1);
  assert.equal(requests[0], '/bookings/disputes');
  assert.equal(disputes[0].status, 'ESCALATED');
  assert.equal(disputes[0].refundPercent, 25);
  assert.equal(disputes[0].refundAmount, 25.01);
  assert.equal(disputes[0].overrideReason, 'Reviewed evidence');
  await disputesApi.updateDisputeStatus('d/1', 3, 'REFUND_PENDING');
  assert.equal(requests[1].url, '/bookings/disputes/d%2F1/status');
  assert.equal(requests[1].body.version, 3);
  assert.equal(requests[1].body.status, 'REFUND_PENDING');
});

test('booking map preserves unlocated bookings, accepts zero, and rejects out-of-range coordinates', async () => {
  const { liveMapApi } = load('src/modules/operations/live-map/api.ts', {
    '@/lib/api/client': {
      get: async () => ({
        data: {
          data: [
            { id: 'zero', venue: { lat: 0, lng: 0 } },
            { id: 'missing' },
            { id: 'bad', venue: { lat: 91, lng: 0 } },
            { id: 'snapshot', venueSnapshot: { lat: 19, lng: 73 } },
          ],
        },
      }),
    },
  });
  const rows = await liveMapApi.getLiveBookings();
  assert.equal(rows.length, 4);
  assert.equal(rows[0].latitude, 0);
  assert.equal(rows[1].latitude, null);
  assert.equal(rows[2].latitude, null);
  assert.equal(rows[3].latitude, 19);
});

test('all twelve workflow adapters read authenticated HTTP envelopes and propagate failures', async () => {
  const areas = [
    'discovery/events',
    'discovery/ranking-config',
    'legal/data-privacy',
    'legal/legal-requests',
    'marketing/notifications',
    'operations/city-launch',
    'operations/growth-abuse',
    'operations/venues',
    'platform-config/policy-docs',
    'platform-config/training',
    'support/sla-dashboard',
    'support/tickets',
  ];
  for (const area of areas) {
    const requests = [];
    let fail = false;
    const http = {
      get: async (url) => {
        requests.push(url);
        if (fail) throw new Error('Server unavailable');
        return { data: { data: [] } };
      },
    };
    const exports = load('src/modules/' + area + '/api.ts', { '@/lib/api/client': http });
    for (const api of Object.values(exports))
      for (const [name, operation] of Object.entries(api)) {
        if (!name.startsWith('get')) continue;
        await operation();
        assert(requests.at(-1).startsWith('/'));
        fail = true;
        await assert.rejects(operation(), /Server unavailable/);
        fail = false;
      }
  }
});

test('workflow writes encode IDs and never send a caller supplied staff identity for self-assignment', async () => {
  const calls = [];
  const http = {
    post: async (url, body) => calls.push({ url, body }),
    patch: async (url, body) => calls.push({ url, body }),
  };
  const { ticketsApi } = load('src/modules/support/tickets/api.ts', { '@/lib/api/client': http });
  await ticketsApi.assignToMe('ticket/one', 'Impersonated staff');
  assert.equal(calls[0].url, '/support/tickets/ticket%2Fone/assign-self');
  assert.equal(calls[0].body, undefined);
  await ticketsApi.reassignTicket('ticket/one', 'staff-id');
  assert.equal(calls[1].body.staffId, 'staff-id');
  const { eventsApi } = load('src/modules/discovery/events/api.ts', { '@/lib/api/client': http });
  await eventsApi.toggleEvent({ id: 'event/one', active: false });
  assert.equal(calls[2].url, '/discovery/events/event%2Fone/active');
  assert.equal(calls[2].body.active, false);
});

test('routes without verified upstream integrations remain blocked, including direct links', () => {
  const { isRouteReleased, UNRELEASED_ROUTES } = load('src/lib/release.ts');
  for (const route of UNRELEASED_ROUTES) {
    assert.equal(isRouteReleased(route, 'production'), false);
    assert.equal(isRouteReleased(route + '/detail', 'production'), false);
    assert.equal(isRouteReleased(route, 'development'), false);
  }
  assert.equal(isRouteReleased('/financial/escrow', 'production'), true);
  assert.equal(isRouteReleased('/system/master-data', 'production'), true);
  assert.equal(isRouteReleased('/analytics/growth', 'production'), true);
  assert.equal(isRouteReleased('/analytics/operational', 'production'), true);
  assert.equal(isRouteReleased('/analytics/financial', 'production'), true);
  assert.equal(isRouteReleased('/analytics/safety', 'production'), true);
  for (const route of [
    '/support/tickets',
    '/support/sla-dashboard',
    '/discovery/events',
    '/discovery/ranking-config',
    '/operations/venues',
    '/operations/city-launch',
    '/operations/growth-abuse',
    '/legal/data-privacy',
    '/legal/legal-requests',
    '/marketing/notifications',
    '/platform-config/policy-docs',
    '/platform-config/training',
  ])
    assert.equal(isRouteReleased(route, 'production'), true);
});

test('SOS preserves escalated and investigating alerts and requests only open records', async () => {
  const requests = [];
  const { sosApi } = load('src/modules/safety/sos-dashboard/api.ts', {
    '@/lib/api/client': {
      get: async (url, options) => {
        requests.push({ url, options });
        return {
          data: {
            data: [
              'TRIGGERED',
              'INVESTIGATING',
              'ESCALATED_AUTHORITIES',
              'RESOLVED_REAL_INCIDENT',
              'NEW_STATUS',
            ].map((status) => ({
              id: status,
              userId: 'customer-1',
              userType: 'CUSTOMER',
              status,
              lat: 0,
              lng: 0,
              createdAt: '2026-01-01T12:00:00Z',
              booking: null,
            })),
          },
        };
      },
      patch: async (url, body) => {
        requests.push({ url, body });
      },
    },
  });
  const alerts = await sosApi.getAlerts();
  assert.deepEqual(
    Array.from(alerts, (alert) => alert.status),
    ['ACTIVE', 'INVESTIGATING', 'ESCALATED', 'RESOLVED', 'UNKNOWN'],
  );
  assert.equal(alerts[0].latitude, 0);
  assert.equal(alerts[0].userName, 'customer-1');
  assert.equal(requests[0].options.params.activeOnly, true);
  await sosApi.updateStatus('alert/one', 'ACKNOWLEDGED');
  assert.equal(requests[1].url, '/safety/sos/alert%2Fone/status');
});

test('SOS locations reject missing and invalid coordinates without discarding zero', () => {
  const { getSosPosition, getSosMapLinks } = load('src/modules/safety/sos-dashboard/location.ts');
  for (const [latitude, longitude] of [
    [null, null],
    [undefined, 73],
    [NaN, 73],
    [91, 73],
    [18, -181],
    ['18', '73'],
    [Infinity, 73],
  ]) {
    assert.equal(getSosPosition({ latitude, longitude }), null);
    assert.equal(getSosMapLinks({ latitude, longitude }), null);
  }
  assert.equal(getSosPosition({ latitude: 0, longitude: 0 }).lat, 0);
  const links = getSosMapLinks({ latitude: 18.5204, longitude: 73.8567 });
  assert.equal(new URL(links.directions).searchParams.get('destination'), '18.5204,73.8567');
  assert.equal(new URL(links.map).origin, 'https://www.google.com');
});

test('a malformed SOS response is a failure, not an empty emergency queue', async () => {
  const { sosApi } = load('src/modules/safety/sos-dashboard/api.ts', {
    '@/lib/api/client': { get: async () => ({ data: { data: null } }) },
  });
  await assert.rejects(sosApi.getAlerts(), /Invalid SOS response/);
});

test('escrow and wallets use separate endpoints and preserve server pagination and amounts', async () => {
  const requests = [];
  const envelope = {
    data: [{ id: 'booking-1', companionNetAmount: '100.25' }],
    meta: { page: 3, totalItems: 45 },
  };
  const { escrowApi } = load('src/modules/financial/escrow/api.ts', {
    '@/lib/api/client': {
      get: async (url, options) => {
        requests.push({ url, options });
        return { data: envelope };
      },
      post: async (...args) => {
        requests.push(args);
      },
    },
  });
  const result = await escrowApi.getRecords(3);
  assert.equal(result, envelope);
  assert.equal(requests[0].url, '/financial/escrow');
  assert.equal(requests[0].options.params.page, 3);
  await escrowApi.getWallets(2);
  assert.equal(requests[1].url, '/financial/wallets');
  assert.equal(requests[1].options.params.page, 2);
  await escrowApi.releaseEscrow('booking/1');
  assert.deepEqual(requests[2], ['/financial/escrow/booking%2F1/release']);
});

test('payouts preserve pagination, exact amounts, verification and action payloads', async () => {
  const requests = [];
  const envelope = {
    data: [{ id: 'payout-1', amount: '100.25', bankAccount: { verified: true } }],
    meta: { page: 2, totalItems: 25 },
  };
  const { payoutsApi } = load('src/modules/financial/payouts/api.ts', {
    '@/lib/api/client': {
      get: async (url, options) => {
        requests.push({ url, options });
        return { data: envelope };
      },
      post: async (url, body) => {
        requests.push({ url, body });
      },
    },
  });
  assert.equal(await payoutsApi.getPayouts(2, 'ON_HOLD'), envelope);
  assert.equal(requests[0].options.params.page, 2);
  assert.equal(requests[0].options.params.status, 'ON_HOLD');
  await payoutsApi.updatePayout({ id: 'payout/1', action: 'lift-hold' });
  assert.equal(requests[1].url, '/financial/payouts/payout%2F1/lift-hold');
  assert.equal(Object.keys(requests[1].body).length, 0);
  await payoutsApi.updatePayout({ id: 'payout-1', action: 'hold', reason: 'Account review' });
  assert.equal(requests[2].body.reason, 'Account review');
  assert.equal(requests[2].body.action, undefined);
  await payoutsApi.updatePayout({ id: 'payout-1', action: 'mark-paid', utrNumber: 'UTR-123' });
  assert.equal(requests[3].body.utrNumber, 'UTR-123');
});

test('verification preserves missing evidence instead of inventing failed checks', async () => {
  const { verificationApi } = load('src/modules/verification/api.ts', {
    '@/lib/api/client': {
      get: async () => ({
        data: {
          data: [
            {
              id: 'missing',
              applicantId: 'customer-1',
              faceMatchScore: null,
              livenessPass: null,
              documentValid: null,
            },
            {
              id: 'failed',
              applicantId: 'customer-2',
              faceMatchScore: 0,
              livenessPass: false,
              documentValid: false,
            },
          ],
        },
      }),
    },
  });
  const { data: records } = await verificationApi.getCases();
  assert.equal(records[0].faceMatchScore, null);
  assert.equal(records[0].livenessPass, null);
  assert.equal(records[0].documentValid, null);
  assert.equal(records[1].faceMatchScore, 0);
  assert.equal(records[1].livenessPass, false);
  assert.equal(records[1].documentValid, false);
});

test('verification preserves server pagination and sends only writable decision/settings fields', async () => {
  const requests = [];
  const meta = {
    page: 3,
    pageSize: 20,
    totalItems: 51,
    totalPages: 3,
    hasNext: false,
    hasPrevious: true,
  };
  const row = { id: 'case-1', applicantId: 'applicant-1', auditTrail: [] };
  const { verificationApi } = load('src/modules/verification/api.ts', {
    '@/lib/api/client': {
      get: async (url, config) => {
        requests.push({ url, config });
        return { data: { data: [row], meta } };
      },
      post: async (url, body) => {
        requests.push({ url, body });
        return { data: { data: row } };
      },
      put: async (url, body) => {
        requests.push({ url, body });
        return { data: { data: body } };
      },
    },
  });
  const page = await verificationApi.getCases('REQUEST_RESUBMISSION', 3);
  assert.equal(page.meta, meta);
  assert.equal(requests[0].config.params.page, 3);
  assert.equal(requests[0].config.params.pageSize, 20);
  assert.equal(requests[0].config.params.status, 'REQUEST_RESUBMISSION');
  await verificationApi.submitDecision({
    caseId: 'case/1',
    decision: 'REJECT',
    reason: 'Unreadable document',
  });
  assert.equal(requests[1].url, '/verification/cases/case%2F1/decision');
  assert.equal(requests[1].body.decision, 'REJECTED');
  assert.equal(requests[1].body.reason, 'Unreadable document');
  await verificationApi.updateThresholds({
    id: 'singleton',
    updatedAt: 'server-owned',
    autoApproveThreshold: 90,
    autoRejectThreshold: 30,
    livenessRequired: false,
    enabledProvider: 'IDFY',
  });
  assert.deepEqual(Object.keys(requests[2].body).sort(), [
    'autoApproveThreshold',
    'autoRejectThreshold',
    'enabledProvider',
    'livenessRequired',
  ]);
  assert.equal(requests[2].body.livenessRequired, false);
});

test('customer and refund APIs preserve server pagination metadata', async () => {
  const requests = [];
  const meta = {
    page: 2,
    pageSize: 20,
    totalItems: 25,
    totalPages: 2,
    hasNext: false,
    hasPrevious: true,
  };
  const axios = {
    get: async (url, options) => {
      requests.push({ url, options });
      return { data: { data: [], meta } };
    },
  };
  const { customersApi } = load('src/modules/customers/api.ts', { '@/lib/api/client': axios });
  const { refundsApi } = load('src/modules/financial/refunds/api.ts', {
    '@/lib/api/client': axios,
  });
  assert.equal((await customersApi.getCustomers(2)).meta, meta);
  assert.equal((await customersApi.getBookingHistory('customer/1', 2)).meta, meta);
  assert.equal((await customersApi.getTransactionHistory('customer/1', 2)).meta, meta);
  assert.equal((await refundsApi.getRefunds(2)).meta, meta);
  assert.equal(requests[0].options.params.page, 2);
  assert.equal(requests[1].options.params.pageSize, 20);
  assert.equal(requests[3].url, '/financial/refunds');
});

test('employee API maps departments and requests server-side pages and filters', async () => {
  const requests = [];
  const meta = {
    page: 3,
    pageSize: 20,
    totalItems: 45,
    totalPages: 3,
    hasNext: false,
    hasPrevious: true,
  };
  const { employeeApi } = load('src/modules/system/employees/api.ts', {
    '@/lib/api/client': {
      get: async (url, options) => {
        requests.push({ url, options });
        return {
          data: { data: [{ id: 'staff', department: 'TRUST_AND_SAFETY', roles: [] }], meta },
        };
      },
    },
  });
  const result = await employeeApi.getPage(3, 20, 'Trust & Safety');
  assert.equal(result.meta, meta);
  assert.equal(result.data[0].department, 'Trust & Safety');
  assert.equal(requests[0].url, '/employees');
  assert.equal(requests[0].options.params.page, 3);
  assert.equal(requests[0].options.params.pageSize, 20);
  assert.equal(requests[0].options.params.department, 'TRUST_AND_SAFETY');
});

test('trust detail reads the stored score and sends the exact override instead of recomputing', async () => {
  const writes = [];
  const { trustScoreApi } = load('src/modules/trust-score/api.ts', {
    '@/lib/api/client': {
      get: async (url) => ({
        data: {
          data: url.endsWith('/history')
            ? []
            : { id: 'c1', name: 'Actual companion', trustScore: 63 },
        },
      }),
      patch: async (url, body) => {
        writes.push({ url, body });
      },
    },
  });
  const detail = await trustScoreApi.getDetail('c1');
  assert.equal(detail.currentScore, 63);
  assert.equal(detail.companionName, 'Actual companion');
  assert.equal(detail.punctualityScore, null);
  assert.equal(detail.lastUpdated, null);
  await trustScoreApi.applyOverride('c1', 87, 'Reviewed evidence');
  assert.equal(writes[0].url, '/companions/c1/trust-score');
  assert.equal(writes[0].body.newScore, 87);
  assert.equal(writes[0].body.reason, 'Reviewed evidence');
});

test('live sessions do not invent GPS or check-in and preserve a real zero coordinate', async () => {
  const { liveSessionsApi } = load('src/modules/safety/live-sessions/api.ts', {
    '@/lib/api/client': {
      get: async () => ({
        data: {
          data: [
            { id: 'missing', endTime: '2027-01-01T00:00:00Z' },
            { id: 'real', endTime: '2027-01-01T00:00:00Z', venue: { lat: 0, lng: 12 } },
          ],
        },
      }),
    },
  });
  const rows = await liveSessionsApi.getLiveSessions();
  assert.equal(rows[0].venueLocation, null);
  assert.equal(rows[0].checkInStatus, null);
  assert.equal(rows[1].venueLocation.lat, 0);
  assert.equal(rows[1].venueLocation.lng, 12);
});

test('missing system configuration fails visibly instead of returning invented financial settings', async () => {
  const { configApi } = load('src/modules/system/config/api.ts', {
    '@/lib/api/client': { get: async () => ({ data: { data: null } }) },
  });
  await assert.rejects(configApi.getConfig(), /not set up/);
});

test('empty trust dashboard and rules stay empty; API failures are propagated', async () => {
  const { trustScoreApi } = load('src/modules/trust-score/api.ts', {
    '@/lib/api/client': {
      get: async (url) => ({ data: { data: url.endsWith('/rules') ? [] : { companions: [] } } }),
    },
  });
  assert.equal((await trustScoreApi.getSummaries()).length, 0);
  assert.equal((await trustScoreApi.getBonusRules()).length, 0);
  const offline = load('src/modules/trust-score/api.ts', {
    '@/lib/api/client': {
      get: async () => {
        throw new Error('Backend unavailable');
      },
    },
  }).trustScoreApi;
  await assert.rejects(offline.getSummaries(), /Backend unavailable/);
});
