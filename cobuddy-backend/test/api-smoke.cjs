/* Local integration test: starts the compiled API on an ephemeral port.
 * Creates uniquely named staff/KYC fixtures, tests reads/auth and isolated KYC writes, then removes fixtures.
 * Never resets an existing employee password or seeds domain/demo data.
 */
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID, randomBytes } = require('node:crypto');
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  const url = new URL(process.env.DATABASE_URL);
  if (['production', 'staging'].includes(process.env.NODE_ENV))
    throw new Error('Run smoke tests on a development/test database.');
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
    process.env.SMOKE_ALLOW_NONLOCAL_DATABASE !== '1'
  ) {
    throw new Error(
      'Non-local database requires SMOKE_ALLOW_NONLOCAL_DATABASE=1 for a dedicated test database.',
    );
  }
  process.env.NODE_ENV = 'test';
  const { createApplication } = require('../dist/src/main.js');
  const prisma = new PrismaClient();
  const runId = randomUUID();
  const userAgent = 'CoBuddyApiSmoke/' + runId;
  const fixtureIds = [];
  const caseFixtureIds = [];
  const results = [];
  let app;
  const check = (name, passed, detail) =>
    results.push({ name, passed, ...(detail ? { detail } : {}) });
  try {
    const password = randomBytes(24).toString('base64url') + 'Aa1!';
    const passwordHash = await bcrypt.hash(password, 10);
    for (const role of ['SUPER_ADMIN', 'MODERATOR']) {
      const employee = await prisma.staffEmployee.create({
        data: {
          employeeId: 'SMOKE-' + role + '-' + runId,
          name: 'API smoke fixture',
          email: role.toLowerCase() + '-' + runId + '@example.invalid',
          passwordHash,
          designation: 'Integration fixture',
          department: 'ENGINEERING',
          roles: [role],
          cityScopeIds: [],
          status: 'ACTIVE',
          inviteStatus: 'ACCEPTED',
        },
      });
      fixtureIds.push(employee.id);
    }
    app = await createApplication();
    app.useLogger(false);
    await app.listen(0, '127.0.0.1');
    const address = app.getHttpServer().address();
    const base = 'http://127.0.0.1:' + address.port;
    const request = async (method, route, token, body) => {
      const response = await fetch(base + route, {
        method,
        headers: {
          'User-Agent': userAgent,
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(15000),
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
      return { status: response.status, data, headers: response.headers };
    };
    const health = await request('GET', '/api/health');
    check(
      'PostgreSQL and Redis readiness',
      health.status === 200 &&
        health.data?.data?.services?.postgres === 'connected' &&
        health.data?.data?.services?.redis === 'connected',
      'HTTP ' + health.status,
    );
    check('Correlation ID returned', !!health.headers.get('x-request-id'));
    check('API responses are not cached', health.headers.get('cache-control') === 'no-store');
    const malformed = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"password":"private-smoke-marker",broken',
      signal: AbortSignal.timeout(15000),
    });
    const malformedBody = await malformed.text();
    check(
      'Malformed JSON is rejected without disclosing request input',
      malformed.status === 400 &&
        !malformedBody.includes('private-smoke-marker') &&
        malformed.headers.get('cache-control') === 'no-store' &&
        !!malformed.headers.get('x-request-id'),
    );
    const oversized = await request('POST', '/api/auth/login', null, {
      password: 'x'.repeat(1024 * 1024),
    });
    check(
      'Oversized input returns a non-cacheable 413',
      oversized.status === 413 &&
        oversized.data?.error?.code === 'PAYLOAD_TOO_LARGE' &&
        oversized.headers.get('cache-control') === 'no-store',
    );
    const preflight = await fetch(base + '/api/auth/login', {
      method: 'OPTIONS',
      headers: {
        Origin: process.env.CORS_ORIGIN.split(',')[0].trim(),
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization',
      },
      signal: AbortSignal.timeout(15000),
    });
    check(
      'Configured frontend origin passes CORS preflight',
      preflight.status === 204 &&
        preflight.headers.get('access-control-allow-origin') ===
          process.env.CORS_ORIGIN.split(',')[0].trim(),
    );
    const spec = (await request('GET', '/swagger-json')).data;
    assert(spec?.paths, 'OpenAPI inventory available');
    const operations = Object.entries(spec.paths).flatMap(([route, methods]) =>
      Object.entries(methods)
        .filter(([method]) => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
        .map(([method, definition]) => ({ route, method: method.toUpperCase(), definition })),
    );
    const publicRoutes = new Set([
      '/api',
      '/api/',
      '/api/health',
      '/api/auth/login',
      '/api/auth/refresh',
      '/api/auth/verify-2fa',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/employees/accept-invite',
    ]);
    for (const op of operations) {
      if (publicRoutes.has(op.route) || op.route.includes('accept-invite')) continue;
      const route = op.route.replace(/\{[^}]+\}/g, 'smoke-missing-id');
      const response = await request(
        op.method,
        route,
        null,
        ['GET', 'DELETE'].includes(op.method) ? undefined : {},
      );
      check(
        'Anonymous ' + op.method + ' ' + op.route,
        response.status === 401,
        'HTTP ' + response.status,
      );
    }
    check(
      'Login rejects invalid input',
      (await request('POST', '/api/auth/login', null, {})).status === 400,
    );
    const login = await request('POST', '/api/auth/login', null, {
      email: 'super_admin-' + runId + '@example.invalid',
      password,
    });
    assert(login.status === 201 && login.data?.data?.accessToken, 'Fixture login must succeed');
    const session = login.data.data;
    check('Login authenticated against PostgreSQL bcrypt hash', true);
    const openSos = await request('GET', '/api/safety/sos?activeOnly=true', session.accessToken);
    check(
      'SOS map reads only open alert statuses',
      openSos.status === 200 &&
        Array.isArray(openSos.data?.data) &&
        openSos.data.data.every((alert) =>
          ['TRIGGERED', 'ACKNOWLEDGED', 'INVESTIGATING', 'ESCALATED_AUTHORITIES'].includes(
            alert.status,
          ),
        ),
    );
    check(
      'SOS history accepts an explicit false filter',
      (await request('GET', '/api/safety/sos?activeOnly=false', session.accessToken)).status ===
        200,
    );
    check(
      'SOS rejects an ambiguous open-alert filter',
      (await request('GET', '/api/safety/sos?activeOnly=invalid', session.accessToken)).status ===
        400,
    );
    const cities = await request(
      'GET',
      '/api/master-data/cities?page=1&pageSize=200&include=areas',
      session.accessToken,
    );
    check(
      'Frontend cities query includes areas',
      cities.status === 200 &&
        cities.data?.success === true &&
        Array.isArray(cities.data?.data) &&
        cities.data.data.every((city) => Array.isArray(city.areas)) &&
        cities.data?.meta?.pageSize === 200,
      'HTTP ' + cities.status,
    );
    const login2 = await request('POST', '/api/auth/login', null, {
      email: 'super_admin-' + runId + '@example.invalid',
      password,
    });
    const secondSession = login2.data.data;
    const reportEnd = new Date();
    const reportRange = new URLSearchParams({
      from: new Date(reportEnd.getFullYear(), reportEnd.getMonth(), 1).toISOString(),
      to: reportEnd.toISOString(),
    }).toString();
    const queryFixtures = new Map([
      ['/api/financial/revenue-reports/daily', reportRange],
      ['/api/financial/revenue-reports/by-city', reportRange],
    ]);
    for (const op of operations.filter(
      (op) => op.method === 'GET' && !op.route.includes('{') && !publicRoutes.has(op.route),
    )) {
      const query = queryFixtures.get(op.route);
      const required = (op.definition.parameters || []).filter(
        (parameter) => parameter.in === 'query' && parameter.required,
      );
      if (required.length && !query) {
        results.push({
          name: 'Authenticated GET ' + op.route,
          skipped: true,
          detail: 'Requires query: ' + required.map((p) => p.name).join(', '),
        });
        continue;
      }
      const response = await request(
        'GET',
        op.route + (query ? '?' + query : ''),
        session.accessToken,
      );
      const unavailable =
        op.route.startsWith('/api/moderation/flagged-chats') && response.status === 503;
      check(
        'Authenticated GET ' + op.route,
        (response.status === 200 && response.data?.success === true) || unavailable,
        unavailable ? 'HTTP 503 expected: chat provider unavailable' : 'HTTP ' + response.status,
      );
    }
    const modLogin = await request('POST', '/api/auth/login', null, {
      email: 'moderator-' + runId + '@example.invalid',
      password,
    });
    assert(modLogin.data?.data?.accessToken, 'Moderator login must succeed');
    const moderatorToken = modLogin.data.data.accessToken;
    check(
      'Moderator customer module permission',
      (await request('GET', '/api/customers', moderatorToken)).status === 200,
    );
    check(
      'Moderator cannot manage employees',
      (await request('GET', '/api/employees', moderatorToken)).status === 403,
    );
    const createCaseFixture = async (suffix) => {
      const kyc = await prisma.verificationCase.create({
        data: {
          caseRef: `SMOKE-${suffix}-${runId}`,
          applicantId: `smoke-nonexistent-applicant-${runId}`,
          applicantType: 'CUSTOMER',
          documentType: 'PASSPORT',
          idDocumentUrl: 'https://example.invalid/test-document',
          selfieUrl: 'https://example.invalid/test-selfie',
        },
      });
      caseFixtureIds.push(kyc.id);
      return kyc.id;
    };
    const caseId = await createCaseFixture('concurrency');
    check(
      'KYC rejection requires a documented reason',
      (
        await request('POST', `/api/verification/cases/${caseId}/decision`, moderatorToken, {
          decision: 'REJECTED',
        })
      ).status === 400,
    );
    check(
      'Manual KYC endpoint rejects automatic-decision status values',
      (
        await request('POST', `/api/verification/cases/${caseId}/decision`, moderatorToken, {
          decision: 'AUTO_APPROVED',
        })
      ).status === 400,
    );
    const thresholdBefore = await prisma.verificationThreshold.findUnique({
      where: { id: 'singleton' },
    });
    check(
      'KYC settings reject string booleans instead of coercing false to true',
      (
        await request('PUT', '/api/verification/thresholds', moderatorToken, {
          livenessRequired: 'false',
        })
      ).status === 400,
    );
    check(
      'KYC settings reject null thresholds',
      (
        await request('PUT', '/api/verification/thresholds', moderatorToken, {
          autoApproveThreshold: null,
        })
      ).status === 400,
    );
    const overlap = await request('PUT', '/api/verification/thresholds', moderatorToken, {
      autoApproveThreshold: 30,
      autoRejectThreshold: 70,
    });
    const thresholdAfter = await prisma.verificationThreshold.findUnique({
      where: { id: 'singleton' },
    });
    check(
      'Overlapping KYC thresholds are rejected without changing stored settings',
      overlap.status === 400 && JSON.stringify(thresholdBefore) === JSON.stringify(thresholdAfter),
    );
    const verificationPage = await request(
      'GET',
      '/api/verification/cases?page=2&pageSize=1',
      moderatorToken,
    );
    check(
      'KYC queue preserves requested pagination metadata',
      verificationPage.status === 200 &&
        verificationPage.data?.meta?.page === 2 &&
        verificationPage.data?.meta?.pageSize === 1 &&
        Array.isArray(verificationPage.data?.data) &&
        verificationPage.data.data.length <= 1 &&
        typeof verificationPage.data.meta.totalItems === 'number',
    );
    const rerun = await request(
      'POST',
      `/api/verification/cases/re-run-auto-check/${caseId}`,
      moderatorToken,
      {},
    );
    const unchecked = await prisma.verificationCase.findUniqueOrThrow({ where: { id: caseId } });
    check(
      'Unavailable KYC provider returns 503 without inventing evidence',
      rerun.status === 503 &&
        unchecked.status === 'PENDING_MANUAL_REVIEW' &&
        unchecked.faceMatchScore === null &&
        unchecked.documentValid === null &&
        unchecked.livenessPass === null &&
        unchecked.autoRunAt === null,
    );
    const decisions = await Promise.all(
      [session.accessToken, moderatorToken].map((token) =>
        request('POST', `/api/verification/cases/${caseId}/decision`, token, {
          decision: 'REQUEST_RESUBMISSION',
          reason: 'Integration fixture: unreadable document',
        }),
      ),
    );
    check(
      'Concurrent reviewers can commit only one KYC decision',
      decisions.filter((response) => response.status === 201).length === 1 &&
        decisions.filter((response) => response.status === 409).length === 1,
      decisions.map((response) => response.status).join(', '),
    );
    const decided = await prisma.verificationCase.findUniqueOrThrow({
      where: { id: caseId },
      include: { auditTrail: true },
    });
    check(
      'A committed KYC decision records exactly one reviewer audit event',
      decided.status === 'REQUEST_RESUBMISSION' &&
        decided.auditTrail.length === 1 &&
        decided.auditTrail[0].action === 'DECISION_REQUEST_RESUBMISSION' &&
        decided.auditTrail[0].actorId === decided.reviewedByStaffId &&
        fixtureIds.includes(decided.reviewedByStaffId),
    );
    check(
      'Already-decided KYC cases reject repeated decisions',
      (
        await request('POST', `/api/verification/cases/${caseId}/decision`, moderatorToken, {
          decision: 'APPROVED',
        })
      ).status === 409,
    );
    const rollbackCaseId = await createCaseFixture('rollback');
    const failedDecision = await request(
      'POST',
      `/api/verification/cases/${rollbackCaseId}/decision`,
      moderatorToken,
      { decision: 'APPROVED' },
    );
    const rolledBack = await prisma.verificationCase.findUniqueOrThrow({
      where: { id: rollbackCaseId },
      include: { auditTrail: true },
    });
    check(
      'Failed applicant update rolls back the KYC decision and audit event',
      failedDecision.status === 404 &&
        rolledBack.status === 'PENDING_MANUAL_REVIEW' &&
        rolledBack.decidedAt === null &&
        rolledBack.reviewedByStaffId === null &&
        rolledBack.auditTrail.length === 0,
      `HTTP ${failedDecision.status}; state ${rolledBack.status}; audit events ${rolledBack.auditTrail.length}`,
    );
    await prisma.staffEmployee.update({
      where: { id: fixtureIds[1] },
      data: { status: 'SUSPENDED' },
    });
    check(
      'Suspension immediately revokes access',
      (await request('GET', '/api/auth/me', moderatorToken)).status === 401,
    );
    const refreshed = await request('POST', '/api/auth/refresh', null, {
      refreshToken: session.refreshToken,
    });
    check(
      'Refresh rotates session',
      refreshed.status === 200 && refreshed.data?.data?.refreshToken !== session.refreshToken,
    );
    check(
      'Refresh replay rejected',
      (await request('POST', '/api/auth/refresh', null, { refreshToken: session.refreshToken }))
        .status === 401,
    );
    const logout = await request('POST', '/api/auth/logout', refreshed.data?.data?.accessToken, {});
    check('Logout succeeds', logout.status === 201);
    check(
      'Logged-out access token rejected with another session alive',
      (await request('GET', '/api/auth/me', session.accessToken)).status === 401,
    );
    check(
      'Independent session remains valid',
      (await request('GET', '/api/auth/me', secondSession.accessToken)).status === 200,
    );
    const logs = await prisma.auditLog.findMany({
      where: { userAgent },
      select: { details: true, oldValues: true, newValues: true },
    });
    const serialized = JSON.stringify(logs);
    check(
      'Audit log never stores submitted password/refresh token',
      logs.length > 0 &&
        !serialized.includes(password) &&
        !serialized.includes(session.refreshToken),
    );
    const report = {
      generatedAt: new Date().toISOString(),
      operationCount: operations.length,
      passed: results.filter((x) => x.passed).length,
      failed: results.filter((x) => x.passed === false).length,
      skipped: results.filter((x) => x.skipped).length,
      checks: results,
    };
    const reportPath =
      process.env.SMOKE_REPORT_PATH || path.join(__dirname, 'results/api-smoke.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
    console.log(
      JSON.stringify(
        {
          operations: report.operationCount,
          passed: report.passed,
          failed: report.failed,
          skipped: report.skipped,
          failures: results.filter((x) => x.passed === false),
        },
        null,
        2,
      ),
    );
    if (report.failed) process.exitCode = 1;
  } finally {
    if (app) await app.close();
    await prisma.verificationCase.deleteMany({
      where: { id: { in: caseFixtureIds }, caseRef: { endsWith: runId } },
    });
    await prisma.auditLog.deleteMany({ where: { userAgent } });
    await prisma.staffEmployee.deleteMany({
      where: { id: { in: fixtureIds }, employeeId: { endsWith: runId } },
    });
    await prisma.$disconnect();
  }
}
main().catch((error) => {
  console.error(
    error instanceof assert.AssertionError
      ? error.message
      : 'API smoke failed: ' + error.name + '. Check local service availability and configuration.',
  );
  process.exitCode = 1;
});
