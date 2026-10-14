/* Real HTTP/PostgreSQL regression for polymorphic KYC applicant access. */
require('dotenv').config();
const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  assert(!['production', 'staging'].includes(process.env.NODE_ENV));
  assert(['localhost', '127.0.0.1', '[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
  process.env.NODE_ENV = 'test';
  delete process.env.NOTIFICATION_DELIVERY_URL;
  delete process.env.NOTIFICATION_DELIVERY_TOKEN;
  const { createApplication } = require('../dist/src/main.js');
  const db = new PrismaClient();
  const run = randomUUID();
  const cities = [randomUUID(), randomUUID()];
  const applicants = [randomUUID(), randomUUID()];
  const staff = [randomUUID(), randomUUID(), randomUUID()];
  const cases = Array.from({ length: 4 }, () => randomUUID());
  const reports = [randomUUID(), randomUUID()];
  const bans = [randomUUID(), randomUUID()];
  const appeals = [randomUUID(), randomUUID()];
  const reviews = [randomUUID(), randomUUID()];
  const flags = [randomUUID(), randomUUID()];
  let app,
    checks = 0;
  try {
    const password = randomBytes(24).toString('base64url');
    const passwordHash = await bcrypt.hash(password, 10);
    for (const [i, id] of cities.entries()) {
      await db.city.create({
        data: { id, cityCode: `KYC-${run}-${i}`, name: { en: 'Scope fixture' }, state: 'Test' },
      });
    }
    for (const [i, id] of cities.entries()) {
      await db.customer.create({
        data: {
          id: applicants[i],
          name: 'KYC fixture',
          phone: `kyc-customer-${run}-${i}`,
          passwordHash,
          cityId: id,
        },
      });
      // Same IDs in the two account tables must never grant cross-type access.
      await db.companion.create({
        data: {
          id: applicants[i],
          name: 'KYC fixture',
          phone: `kyc-companion-${run}-${i}`,
          passwordHash,
          gender: 'UNSPECIFIED',
          cityId: cities[1 - i],
        },
      });
    }
    for (const [i, id] of staff.entries()) {
      await db.staffEmployee.create({
        data: {
          id,
          employeeId: `KYC-${run}-${i}`,
          name: 'Scope reviewer',
          email: `kyc-${run}-${i}@example.invalid`,
          passwordHash,
          designation: 'Test',
          department: 'ENGINEERING',
          status: 'ACTIVE',
          inviteStatus: 'ACCEPTED',
          roles:
            i === 2 ? ['SUPER_ADMIN'] : i === 1 ? ['MODERATOR', 'CITY_OPS_MANAGER'] : ['MODERATOR'],
          cityScopeIds: i === 0 ? [cities[0]] : [],
        },
      });
    }
    for (const [i, id] of cases.entries()) {
      await db.verificationCase.create({
        data: {
          id,
          caseRef: `KYC-${run}-${i}`,
          applicantId: applicants[i % 2],
          applicantType: i < 2 ? 'CUSTOMER' : 'COMPANION',
          documentType: 'PASSPORT',
          idDocumentUrl: 'https://example.invalid/fixture-document',
          selfieUrl: 'https://example.invalid/fixture-selfie',
          status: 'PENDING_MANUAL_REVIEW',
        },
      });
    }
    for (const i of [0, 1]) {
      await db.userReport.create({
        data: {
          id: reports[i],
          reportRef: `SCOPE-${run}-${i}`,
          reporterId: applicants[i],
          reporterType: 'CUSTOMER',
          reportedUserId: applicants[i],
          reportedUserType: 'CUSTOMER',
          categoryCode: 'scope',
          description: 'Scope fixture',
          evidenceUrls: [],
        },
      });
      await db.userBan.create({
        data: {
          id: bans[i],
          userId: applicants[i],
          userType: 'CUSTOMER',
          reason: 'Scope fixture',
          duration: 'PERMANENT',
          bannedById: staff[2],
        },
      });
      await db.userBanAppeal.create({
        data: { id: appeals[i], banId: bans[i], appealReason: 'Scope fixture' },
      });
      await db.review.create({
        data: {
          id: reviews[i],
          bookingId: `scope-${run}-${i}`,
          byCustomerId: applicants[i],
          toCompanionId: applicants[1 - i],
          rating: 4,
          tagCodes: [],
        },
      });
      await db.fraudFlag.create({
        data: {
          id: flags[i],
          userId: applicants[i],
          userType: 'CUSTOMER',
          category: 'scope',
          description: 'Scope fixture',
          riskScore: 50,
          actionsTaken: [],
        },
      });
    }
    app = await createApplication();
    app.useLogger(false);
    await app.listen(0, '127.0.0.1');
    const base = `http://127.0.0.1:${app.getHttpServer().address().port}/api`;
    const request = async (method, path, token, body, expected = 200) => {
      const response = await fetch(base + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(result.error)}`);
      checks++;
      return result;
    };
    const tokens = [];
    for (const i of [0, 1, 2])
      tokens.push(
        (
          await request(
            'POST',
            '/auth/login',
            null,
            { email: `kyc-${run}-${i}@example.invalid`, password },
            201,
          )
        ).data.accessToken,
      );
    await request('GET', '/verification/cases', null, undefined, 401);
    const list = await request('GET', '/verification/cases?pageSize=100', tokens[0]);
    assert.deepEqual(list.data.map((c) => c.id).sort(), [cases[0], cases[3]].sort());
    assert.equal(list.meta.totalItems, 2);
    const customerList = await request(
      'GET',
      '/verification/cases?applicantType=CUSTOMER',
      tokens[0],
    );
    assert.deepEqual(
      customerList.data.map((c) => c.id),
      [cases[0]],
    );
    for (const id of [cases[1], cases[2]]) {
      await request('GET', '/verification/cases/' + id, tokens[0], undefined, 404);
      await request(
        'POST',
        `/verification/cases/${id}/decision`,
        tokens[0],
        { decision: 'APPROVED' },
        404,
      );
      await request(
        'POST',
        '/verification/cases/re-run-auto-check/' + id,
        tokens[0],
        undefined,
        404,
      );
      assert.equal(
        (await db.verificationCase.findUniqueOrThrow({ where: { id } })).status,
        'PENDING_MANUAL_REVIEW',
      );
    }
    for (const id of [cases[0], cases[3]])
      await request('GET', '/verification/cases/' + id, tokens[0]);
    await request(
      'POST',
      `/verification/cases/${cases[0]}/decision`,
      tokens[0],
      { decision: 'APPROVED' },
      201,
    );
    assert.equal(
      (await db.customer.findUniqueOrThrow({ where: { id: applicants[0] } })).verificationStatus,
      'VERIFIED',
    );
    const empty = await request('GET', '/verification/cases', tokens[1]);
    assert.equal(empty.meta.totalItems, 0);
    await request('GET', '/verification/cases/' + cases[0], tokens[1], undefined, 404);
    for (const id of cases) await request('GET', '/verification/cases/' + id, tokens[2]);
    const trust = await request('GET', '/trust-score/dashboard', tokens[0]);
    assert.deepEqual(
      trust.data.companions.map((c) => c.id),
      [applicants[1]],
    );
    await request('GET', `/trust-score/${applicants[0]}/history`, tokens[0], undefined, 404);
    await request('POST', `/trust-score/recompute/${applicants[0]}`, tokens[0], undefined, 404);
    await request('GET', `/trust-score/${applicants[1]}/history`, tokens[0]);
    for (const [route, ids] of [
      ['reports', reports],
      ['bans', bans],
      ['appeals', appeals],
      ['reviews', reviews],
      ['risk-scores', flags],
    ]) {
      const result = await request('GET', `/moderation/${route}`, tokens[0]);
      assert.deepEqual(
        result.data.map((row) => row.id),
        [ids[0]],
        `${route} leaked a different city`,
      );
      assert.equal(result.meta.totalItems, 1);
      const noScope = await request('GET', `/moderation/${route}`, tokens[1]);
      assert.equal(noScope.meta.totalItems, 0);
    }
    for (const [method, route, body] of [
      ['GET', `/moderation/reports/${reports[1]}`],
      ['POST', `/moderation/reports/${reports[1]}/assign-me`],
      ['PATCH', `/moderation/reports/${reports[1]}/status`, { status: 'RESOLVED' }],
      ['GET', `/moderation/bans/${bans[1]}/appeals`],
      ['PATCH', `/moderation/bans/${bans[1]}/lift`, { reason: 'Scope check' }],
      [
        'POST',
        '/moderation/bans',
        {
          userId: applicants[1],
          userType: 'CUSTOMER',
          reason: 'Scope check',
          duration: 'PERMANENT',
        },
      ],
      ['GET', `/moderation/appeals/${appeals[1]}`],
      ['PATCH', `/moderation/appeals/${appeals[1]}/status`, { status: 'APPROVED' }],
      ['POST', `/moderation/appeals/${appeals[1]}/add-note`, { note: 'Scope check' }],
      ['POST', `/moderation/reviews/${reviews[1]}/approve`],
      ['POST', `/moderation/reviews/${reviews[1]}/remove`, { reason: 'Scope check' }],
      ['PATCH', `/moderation/risk-scores/${applicants[1]}`, { riskLevel: 'LOW' }],
    ])
      await request(method, route, tokens[0], body, 404);
    // A same-ID companion is in scope, but the customer's flag must remain invisible.
    const breakdown = await request('GET', `/moderation/risk-scores/${applicants[1]}`, tokens[0]);
    assert.equal(breakdown.data.user.userType, 'COMPANION');
    assert.equal(breakdown.data.flags.length, 0);
    await request('POST', `/moderation/reports/${reports[0]}/assign-me`, tokens[0], undefined, 201);
    await request('POST', `/moderation/reviews/${reviews[0]}/approve`, tokens[0], undefined, 201);
    await request('PATCH', `/moderation/risk-scores/${applicants[0]}`, tokens[0], {
      riskLevel: 'LOW',
    });
    assert.equal((await db.fraudFlag.findUniqueOrThrow({ where: { id: flags[1] } })).riskScore, 50);
    for (const [method, route, body] of [
      ['PUT', '/verification/thresholds', { autoApproveThreshold: 95 }],
      ['PUT', '/moderation/chat-settings', { enableAutoFlagging: true }],
      ['PUT', '/moderation/risk-scores/config', { minRiskScoreForReview: 50 }],
      ['POST', '/trust-score/rules', { trigger: 'scope-check', delta: 1, category: 'scope' }],
    ])
      await request(method, route, tokens[0], body, 403);
    console.log(
      `PASS: ${checks} city-scope HTTP checks covering KYC, trust scores, moderation lists/details/writes, polymorphic identity and global configuration.`,
    );
  } finally {
    if (app) await app.close();
    await db.fraudFlag.deleteMany({ where: { id: { in: flags } } });
    await db.review.deleteMany({ where: { id: { in: reviews } } });
    await db.userBanAppeal.deleteMany({ where: { id: { in: appeals } } });
    await db.userBan.deleteMany({ where: { id: { in: bans } } });
    await db.userReport.deleteMany({ where: { id: { in: reports } } });
    await db.verificationCase.deleteMany({ where: { id: { in: cases } } });
    await db.customer.deleteMany({ where: { id: { in: applicants } } });
    await db.companion.deleteMany({ where: { id: { in: applicants } } });
    await db.auditLog.deleteMany({ where: { adminId: { in: staff } } });
    await db.staffEmployee.deleteMany({ where: { id: { in: staff } } });
    await db.city.deleteMany({ where: { id: { in: cities } } });
    await db.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
