/* Real HTTP/DB regression. Temporary isolated fixtures are removed in finally. */
require('dotenv').config();
const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const database = new URL(process.env.DATABASE_URL);
  if (
    ['production', 'staging'].includes(process.env.NODE_ENV) ||
    !['localhost', '127.0.0.1', '[::1]'].includes(database.hostname)
  )
    throw new Error('Use a local development/test database only');
  process.env.NODE_ENV = 'test';
  const { createApplication } = require('../dist/src/main.js');
  const prisma = new PrismaClient();
  const run = randomUUID();
  const userAgent = 'DisputeRegression/' + run;
  const cityIds = [randomUUID(), randomUUID()];
  const customerId = randomUUID();
  const walletId = randomUUID();
  const bookingIds = [randomUUID(), randomUUID()];
  const disputeIds = [randomUUID(), randomUUID()];
  const staffIds = [randomUUID(), randomUUID()];
  let app;
  let checks = 0;
  const check = (condition, message) => {
    assert.ok(condition, message);
    checks++;
  };
  try {
    const password = randomBytes(24).toString('base64url') + 'Aa1!';
    const passwordHash = await bcrypt.hash(password, 10);
    for (let index = 0; index < 2; index++) {
      await prisma.city.create({
        data: {
          id: cityIds[index],
          cityCode: 'TEST-' + run + '-' + index,
          name: { en: 'Regression ' + index },
          state: 'Test',
          country: 'Test',
        },
      });
      await prisma.staffEmployee.create({
        data: {
          id: staffIds[index],
          employeeId: 'DISPUTE-' + run + '-' + index,
          name: 'Regression staff',
          email: `dispute-${index}-${run}@example.invalid`,
          passwordHash,
          designation: 'Test',
          department: 'ENGINEERING',
          roles: index ? ['FINANCE_ADMIN'] : ['SUPPORT_AGENT'],
          cityScopeIds: index ? [] : [cityIds[0]],
          status: 'ACTIVE',
          inviteStatus: 'ACCEPTED',
        },
      });
    }
    await prisma.customer.create({
      data: {
        id: customerId,
        name: 'Regression customer',
        email: run + '@example.invalid',
        phone: 'test-' + run,
        passwordHash,
        cityId: cityIds[0],
      },
    });
    await prisma.wallet.create({
      data: { id: walletId, ownerType: 'CUSTOMER', customerId, balance: '10.10' },
    });
    for (let index = 0; index < 2; index++) {
      await prisma.booking.create({
        data: {
          id: bookingIds[index],
          bookingRef: 'TEST-' + run + '-' + index,
          customerId,
          cityId: cityIds[index],
          activityLabel: 'Regression fixture',
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000),
          durationMins: 60,
          status: 'CUSTOMER_CANCELLED',
          bookingAmount: '100.03',
          platformFeeAmount: '20.01',
          companionNetAmount: '80.02',
          paymentStatus: 'PAID',
        },
      });
      await prisma.bookingDispute.create({
        data: {
          id: disputeIds[index],
          bookingId: bookingIds[index],
          disputeReasonId: 'regression',
          raisedBy: 'CUSTOMER',
          description: 'Isolated regression fixture',
          evidenceUrls: [],
        },
      });
    }
    app = await createApplication();
    app.useLogger(false);
    await app.listen(0, '127.0.0.1');
    const base = `http://127.0.0.1:${app.getHttpServer().address().port}/api`;
    const request = async (method, path, token, body) => {
      const response = await fetch(base + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': userAgent,
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(15000),
      });
      return { status: response.status, body: await response.json() };
    };
    const tokens = [];
    for (let index = 0; index < 2; index++) {
      const login = await request('POST', '/auth/login', null, {
        email: `dispute-${index}-${run}@example.invalid`,
        password,
      });
      check(login.status === 200 || login.status === 201, 'Fixture login failed');
      tokens.push(login.body.data.accessToken);
    }
    const [support, finance] = tokens;
    const listed = await request('GET', '/bookings/disputes', support);
    check(
      listed.status === 200 &&
        listed.body.data.some((item) => item.id === disputeIds[0]) &&
        !listed.body.data.some((item) => item.id === disputeIds[1]),
      'Dispute list must apply city scope',
    );
    check(
      (
        await request('PATCH', `/bookings/disputes/${disputeIds[1]}/status`, support, {
          status: 'ESCALATED',
          version: 0,
        })
      ).status === 404,
      'Cross-city status write must fail',
    );
    check(
      (
        await request('POST', `/bookings/disputes/${disputeIds[1]}/penalty-override`, support, {
          percent: 25,
          reason: 'Review',
          version: 0,
        })
      ).status === 404,
      'Cross-city override must fail',
    );
    check(
      (
        await request('POST', `/bookings/disputes/${disputeIds[0]}/penalty-override`, support, {
          percent: 25,
          reason: 42,
          version: 0,
        })
      ).status === 400,
      'Malformed reason must be rejected',
    );
    check(
      (
        await request('PATCH', `/bookings/disputes/${disputeIds[0]}/status`, support, {
          status: 'RESOLVED_REFUND',
          version: 0,
        })
      ).status === 400,
      'Direct paid-state write must be rejected',
    );
    check(
      (
        await request('POST', `/bookings/disputes/${disputeIds[0]}/penalty-override`, support, {
          percent: 25,
          reason: 'Reviewed evidence',
          version: 0,
        })
      ).status === 201,
      'Override must persist',
    );
    check(
      (
        await request('PATCH', `/bookings/disputes/${disputeIds[0]}/status`, support, {
          status: 'ESCALATED',
          version: 1,
        })
      ).status === 200,
      'Escalation must persist without a note',
    );
    let dispute = await prisma.bookingDispute.findUniqueOrThrow({ where: { id: disputeIds[0] } });
    check(
      dispute.workflowStatus === 'ESCALATED' &&
        dispute.refundAmount.toFixed(2) === '25.01' &&
        dispute.overridePercent === 25,
      'Read-after-write state and currency must match',
    );
    const queued = await Promise.all(
      [0, 1].map(() =>
        request('PATCH', `/bookings/disputes/${disputeIds[0]}/status`, support, {
          status: 'REFUND_PENDING',
          version: 2,
        }),
      ),
    );
    check(
      queued.filter((result) => result.status === 200).length === 1 &&
        queued.filter((result) => result.status === 409).length === 1,
      'Concurrent requests must create one refund',
    );
    dispute = await prisma.bookingDispute.findUniqueOrThrow({ where: { id: disputeIds[0] } });
    check(
      dispute.workflowStatus === 'REFUND_PENDING' &&
        dispute.resolvedAt === null &&
        Boolean(dispute.refundId),
      'A queued refund must not be resolved',
    );
    check(
      (await prisma.refund.count({ where: { bookingId: bookingIds[0] } })) === 1,
      'Duplicate finance request must roll back',
    );
    check(
      (await request('POST', `/financial/refunds/${dispute.refundId}/approve`, support, {}))
        .status === 403,
      'Support must not approve finance requests',
    );
    check(
      (await request('POST', `/financial/refunds/${dispute.refundId}/approve`, finance, {}))
        .status === 201,
      'Finance can approve the request',
    );
    const processed = await Promise.all(
      [0, 1].map(() =>
        request('POST', `/financial/refunds/${dispute.refundId}/process`, finance, {}),
      ),
    );
    check(
      processed.filter((result) => result.status === 201).length === 1,
      'Concurrent processing must credit once',
    );
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: walletId } });
    check(
      wallet.balance.toFixed(2) === '35.11' &&
        (await prisma.walletTransaction.count({ where: { refundId: dispute.refundId } })) === 1,
      'Wallet and ledger must contain exactly one refund',
    );
    dispute = await prisma.bookingDispute.findUniqueOrThrow({ where: { id: disputeIds[0] } });
    check(
      dispute.workflowStatus === 'RESOLVED_REFUND' && Boolean(dispute.resolvedAt),
      'Dispute resolution must follow the committed ledger credit',
    );
    check(
      (
        await request('POST', `/bookings/disputes/${dispute.id}/penalty-override`, support, {
          percent: 50,
          reason: 'Reopen',
          version: dispute.version,
        })
      ).status === 409,
      'Terminal dispute must not reopen',
    );
    // Dispute checks above deliberately use SUPPORT_AGENT without CITY_OPS_MANAGER.
    await prisma.staffEmployee.update({
      where: { id: staffIds[0] },
      data: { roles: ['SUPPORT_AGENT', 'CITY_OPS_MANAGER'] },
    });
    const growth = await request('GET', '/analytics/growth', support);
    check(
      growth.status === 200 && growth.body.data.totalUsers === 1,
      'Growth metrics must use the actual scoped customer count',
    );
    const sessions = await request('GET', '/analytics/sessions', support);
    check(
      sessions.status === 200 &&
        sessions.body.data.totalSessionsToday === 1 &&
        sessions.body.data.chartData.length === 24,
      'Session SQL must return actual scoped booking counts',
    );
    const market = await request('GET', '/analytics/market', finance);
    check(
      market.status === 200 &&
        market.body.data.find((row) => row.cityId === cityIds[0])?.totalBookings === 1,
      'Market metrics must return the actual city booking count',
    );
    console.log(JSON.stringify({ suite: 'disputes-and-analytics', passed: checks, failed: 0 }));
  } finally {
    if (app) await app.close();
    await prisma.$transaction(async (tx) => {
      await tx.auditLog.deleteMany({ where: { userAgent } });
      await tx.walletTransaction.deleteMany({ where: { walletId } });
      await tx.bookingDispute.deleteMany({ where: { id: { in: disputeIds } } });
      await tx.refund.deleteMany({ where: { bookingId: { in: bookingIds } } });
      await tx.booking.deleteMany({ where: { id: { in: bookingIds } } });
      await tx.wallet.deleteMany({ where: { id: walletId } });
      await tx.customer.deleteMany({ where: { id: customerId } });
      await tx.staffEmployee.deleteMany({ where: { id: { in: staffIds } } });
      await tx.city.deleteMany({ where: { id: { in: cityIds } } });
    });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(
    error instanceof assert.AssertionError ? error.message : 'Regression failed: ' + error.name,
  );
  process.exitCode = 1;
});
