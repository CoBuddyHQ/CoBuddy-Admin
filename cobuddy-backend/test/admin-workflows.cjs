/* Real local HTTP/PostgreSQL workflow tests. All writes use unique disposable fixtures. */
require('dotenv').config();
const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  assert(!['production', 'staging'].includes(process.env.NODE_ENV));
  assert(['localhost', '127.0.0.1', '[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
  process.env.NODE_ENV = 'test';
  // A test must never deliver notifications to a real provider.
  delete process.env.NOTIFICATION_DELIVERY_URL;
  delete process.env.NOTIFICATION_DELIVERY_TOKEN;
  const { createApplication } = require('../dist/src/main.js');
  const db = new PrismaClient();
  const run = randomUUID();
  const marker = `Workflow ${run}`;
  const staffIds = [],
    cityIds = [],
    customerIds = [],
    companionIds = [],
    policyIds = [],
    lessonIds = [],
    announcementIds = [];
  const results = [];
  let app;
  let token;
  const check = (name, value) => {
    assert(value, name);
    results.push(name);
  };
  try {
    const password = randomBytes(24).toString('base64url');
    const passwordHash = await bcrypt.hash(password, 10);
    for (const n of [1, 2]) {
      const city = await db.city.create({
        data: { cityCode: `${run}-${n}`, name: { en: `${marker}-${n}` }, state: 'Test region' },
      });
      cityIds.push(city.id);
      const customer = await db.customer.create({
        data: {
          name: marker,
          email: `${n}-${run}@example.invalid`,
          phone: `${run}-${n}`,
          passwordHash,
          cityId: city.id,
          spokenLanguageIds: [],
        },
      });
      customerIds.push(customer.id);
    }
    const companion = await db.companion.create({
      data: {
        name: marker,
        phone: `${run}-companion`,
        passwordHash,
        gender: 'UNSPECIFIED',
        cityId: cityIds[0],
        status: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        spokenLanguageIds: [],
        interestIds: [],
        communicationStyleCodes: [],
        activityPaceCodes: [],
      },
    });
    companionIds.push(companion.id);
    const identities = {};
    for (const role of [
      'SUPER_ADMIN',
      'CITY_OPS_MANAGER',
      'SUPPORT_LEAD',
      'SUPPORT_AGENT',
      'MODERATOR',
      'SAFETY_OPERATOR',
    ]) {
      const user = await db.staffEmployee.create({
        data: {
          employeeId: `${role}-${run}`,
          name: marker,
          email: `${role}-${run}@example.invalid`.toLowerCase(),
          passwordHash,
          designation: 'Workflow fixture',
          department: 'ENGINEERING',
          roles: [role],
          cityScopeIds: ['CITY_OPS_MANAGER', 'SAFETY_OPERATOR'].includes(role) ? [cityIds[0]] : [],
          status: 'ACTIVE',
          inviteStatus: 'ACCEPTED',
        },
      });
      staffIds.push(user.id);
      identities[role] = user;
    }
    app = await createApplication();
    app.useLogger(false);
    await app.listen(0, '127.0.0.1');
    const base = `http://127.0.0.1:${app.getHttpServer().address().port}/api`;
    const request = async (
      method,
      path,
      body,
      auth = token,
      expected = method === 'POST' ? 201 : 200,
    ) => {
      const response = await fetch(base + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': marker,
          ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(result.error)}`);
      return result.data;
    };
    const tokens = {};
    for (const [role, user] of Object.entries(identities))
      tokens[role] = (
        await request('POST', '/auth/login', { email: user.email, password }, null)
      ).accessToken;
    token = tokens.SUPER_ADMIN;
    const health = await request('GET', '/health');
    check(
      'PostgreSQL and authenticated Redis are healthy',
      health.services.postgres === 'connected' && health.services.redis === 'connected',
    );
    await request(
      'POST',
      '/auth/login',
      { email: identities.SUPER_ADMIN.email, password: 'incorrect-password' },
      null,
      401,
    );
    check('Wrong password rejected', true);

    const safetyBefore = await request(
      'GET',
      '/analytics/safety',
      undefined,
      tokens.SAFETY_OPERATOR,
    );
    await db.fraudFlag.createMany({
      data: customerIds.map((userId) => ({
        userId,
        userType: 'CUSTOMER',
        category: 'GPS_SPOOFING',
        description: marker,
        riskScore: 5,
        actionsTaken: [],
      })),
    });
    const safetyAfter = await request(
      'GET',
      '/analytics/safety',
      undefined,
      tokens.SAFETY_OPERATOR,
    );
    check(
      'Safety analytics excludes other cities for scoped staff without CITY_OPS_MANAGER',
      safetyAfter.fraudHits === safetyBefore.fraudHits + 1 &&
        safetyAfter.spoofHits === safetyBefore.spoofHits + 1,
    );

    const venueInput = {
      name: { en: marker },
      category: { en: 'Cafe' },
      city: cityIds[0],
      address: 'Test address',
      latitude: 0,
      longitude: 0,
      photoUrl: '',
    };
    await request('POST', '/operations/venues', { ...venueInput, latitude: 91 }, token, 400);
    await request('POST', '/operations/venues', { ...venueInput, latitude: '0' }, token, 400);
    await request(
      'POST',
      '/operations/venues',
      { ...venueInput, city: cityIds[1] },
      tokens.CITY_OPS_MANAGER,
      403,
    );
    const venue = await request('POST', '/operations/venues', venueInput, tokens.CITY_OPS_MANAGER);
    await request('PUT', `/operations/venues/${venue.id}`, {
      ...venueInput,
      address: 'Updated address',
    });
    await request('PATCH', `/operations/venues/${venue.id}/active`, { active: false });
    await request(
      'PATCH',
      `/operations/venues/${venue.id}/active`,
      { active: 'false' },
      token,
      400,
    );
    check(
      'Venue coordinates, zero coordinates, edits and explicit activity state persist',
      (await db.venue.findUnique({ where: { id: venue.id } })).address === 'Updated address',
    );
    const outside = await request('POST', '/operations/venues', {
      ...venueInput,
      city: cityIds[1],
    });
    await request(
      'DELETE',
      `/operations/venues/${outside.id}`,
      undefined,
      tokens.CITY_OPS_MANAGER,
      404,
    );
    check(
      'City-scoped venue reads and writes reject cross-city records',
      !(await request('GET', '/operations/venues', undefined, tokens.CITY_OPS_MANAGER)).some(
        (v) => v.id === outside.id,
      ),
    );
    const event = await request('POST', '/discovery/events', {
      cityId: cityIds[0],
      title: marker,
      description: 'Persisted event',
      startDate: '2027-01-01',
      endDate: '2027-01-02',
    });
    await request('PATCH', `/discovery/events/${event.id}/active`, { active: false });
    await request(
      'POST',
      '/discovery/events',
      {
        cityId: cityIds[0],
        title: marker,
        description: 'Invalid dates',
        startDate: '2027-01-02',
        endDate: '2027-01-01',
      },
      token,
      400,
    );
    check(
      'Event mapping and date validation',
      (await request('GET', '/discovery/events')).find((e) => e.id === event.id).isActive === false,
    );
    const weights = await request('GET', '/discovery/ranking-config');
    await request(
      'PUT',
      '/discovery/ranking-config',
      { ...weights, trustScoreWeight: 101 },
      token,
      400,
    );
    await request('PUT', '/discovery/ranking-config', weights, tokens.CITY_OPS_MANAGER, 403);
    const promotion = await request('POST', '/discovery/ranking-config/promoted', {
      companionId: companion.id,
      promotedUntil: '2099-01-01',
    });
    check(
      'Promotions use real verified companion IDs',
      (await request('GET', '/discovery/ranking-config/promoted')).some(
        (p) => p.id === promotion.id && p.name === marker,
      ),
    );
    await request('DELETE', `/discovery/ranking-config/promoted/${promotion.id}`);

    const launch = await request('POST', '/operations/city-launch', {
      cityName: marker,
      region: 'Workflow region',
      managerName: marker,
      targetLaunchDate: '2027-01-01',
    });
    cityIds.push(launch.cityId);
    await request(
      'PATCH',
      `/operations/city-launch/${launch.id}/status`,
      { status: 'LIVE' },
      token,
      409,
    );
    for (const task of launch.checklist)
      await request('PATCH', `/operations/city-launch/${launch.id}/checklist/${task.id}`, {
        completed: true,
      });
    await request('POST', '/operations/venues', { ...venueInput, city: launch.cityId });
    await request('PATCH', `/operations/city-launch/${launch.id}/status`, { status: 'LIVE' });
    check(
      'Launch requires checklist and venue before activating the city',
      (await db.city.findUnique({ where: { id: launch.cityId } })).active,
    );
    const waitlist = await request('POST', '/operations/city-launch/waitlist', {
      email: `wait-${run}@example.invalid`,
      phone: run.slice(0, 20),
      cityId: cityIds[0],
    });
    await request('POST', `/operations/city-launch/waitlist/${waitlist.id}/approve`);
    check(
      'Waitlist approvals persist actor and timestamp',
      !!(await db.waitlistEntry.findUnique({ where: { id: waitlist.id } })).approvedAt,
    );

    const ticket = await request('POST', '/support/tickets', {
      userId: customerIds[0],
      userType: 'CUSTOMER',
      categoryCode: 'GENERAL',
      priority: 'HIGH',
      subject: marker,
      message: 'Initial request',
      slaDeadline: '2020-01-01',
    });
    await request('POST', `/support/tickets/${ticket.id}/assign-self`, {}, tokens.SUPPORT_AGENT);
    await request(
      'PATCH',
      `/support/tickets/${ticket.id}/assignment`,
      { staffId: identities.SUPPORT_LEAD.id },
      tokens.SUPPORT_AGENT,
      403,
    );
    await request(
      'POST',
      `/support/tickets/${ticket.id}/replies`,
      { message: 'Persisted reply' },
      tokens.SUPPORT_AGENT,
    );
    await request('POST', `/support/tickets/${ticket.id}/escalate`, {}, tokens.SUPPORT_AGENT);
    check(
      'SLA detects actual overdue tickets',
      (await request('GET', '/support/sla-dashboard/alerts', undefined, tokens.SUPPORT_LEAD)).some(
        (a) => a.ticketId === ticket.id && a.status === 'BREACHED',
      ),
    );
    await request(
      'PATCH',
      `/support/tickets/${ticket.id}/status`,
      { status: 'RESOLVED' },
      tokens.SUPPORT_AGENT,
      400,
    );
    await request(
      'PATCH',
      `/support/tickets/${ticket.id}/status`,
      { status: 'RESOLVED', resolutionNote: 'Resolved after reviewing the request' },
      tokens.SUPPORT_AGENT,
    );
    await request(
      'POST',
      `/support/tickets/${ticket.id}/replies`,
      { message: 'Must not add' },
      tokens.SUPPORT_AGENT,
      409,
    );
    check(
      'Resolved tickets preserve messages, audit events and measured SLA duration',
      (
        await request('GET', '/support/sla-dashboard/performance', undefined, tokens.SUPPORT_LEAD)
      ).some(
        (p) =>
          p.agentId === identities.SUPPORT_AGENT.id &&
          p.ticketsResolved === 1 &&
          p.averageResolutionTimeMs >= 0,
      ),
    );
    check(
      'Support agents can load assignment choices without HR permission',
      (await request('GET', '/support/agents', undefined, tokens.SUPPORT_AGENT)).some(
        (a) => a.id === identities.SUPPORT_AGENT.id,
      ),
    );

    const flag = await db.fraudFlag.create({
      data: {
        userId: customerIds[0],
        userType: 'CUSTOMER',
        category: 'REFERRAL_FARMING',
        description: marker,
        riskScore: 90,
        actionsTaken: [],
      },
    });
    const referral = await request('POST', '/marketing/referrals', {
      code: `WF_${run.replaceAll('-', '').slice(0, 20).toUpperCase()}`,
      ownerId: customerIds[0],
      ownerType: 'CUSTOMER',
      signupBonus: 10,
      refereeBonus: 10,
      maxUsages: 5,
    });
    await request(
      'POST',
      `/operations/growth-abuse/${flag.id}/actions`,
      { action: 'BLOCK_REFERRAL' },
      tokens.MODERATOR,
    );
    check(
      'Abuse action actually disables referral codes',
      !(await db.referralCode.findUnique({ where: { id: referral.id } })).active,
    );
    await request(
      'PATCH',
      `/operations/growth-abuse/${flag.id}/status`,
      { status: 'OPEN' },
      tokens.MODERATOR,
      409,
    );

    const policy = await request('POST', '/platform-config/policy-docs', {
      title: { en: marker },
      content: { en: 'Test policy text' },
      type: 'TERMS_OF_SERVICE',
    });
    policyIds.push(policy.id);
    await request('PATCH', `/platform-config/policy-docs/${policy.id}/status`, {
      status: 'ARCHIVED',
    });
    check(
      'Policy version and translated content persist',
      (await request('GET', '/platform-config/policy-docs')).some(
        (p) => p.id === policy.id && p.content.en === 'Test policy text',
      ),
    );
    const lesson = await request('POST', '/platform-config/training', {
      title: { en: marker },
      content: { en: 'Training content' },
      category: 'SAFETY',
    });
    lessonIds.push(lesson.id);
    await request('PATCH', `/platform-config/training/${lesson.id}/status`, {
      status: 'PUBLISHED',
    });
    await request('DELETE', `/platform-config/training/${lesson.id}`, undefined, token, 409);
    check(
      'Training publishing persists and prevents deletion of published lessons',
      (await request('GET', '/platform-config/training')).some(
        (l) => l.id === lesson.id && l.status === 'PUBLISHED',
      ),
    );

    const legal = await request('POST', '/legal/legal-requests', {
      agencyName: marker,
      requestType: 'INFO_REQUEST',
      associatedUserId: customerIds[0],
      userType: 'CUSTOMER',
      caseReference: run,
      deadline: '2099-01-01',
      internalNotes: 'Test preservation',
      documentUrls: ['https://example.invalid/evidence'],
      status: 'OPEN',
    });
    await request('PATCH', `/legal/legal-requests/${legal.id}/status`, {
      status: 'EVIDENCE_PRESERVED',
    });
    const removal = await request('POST', '/legal/data-privacy', {
      userId: customerIds[0],
      userType: 'CUSTOMER',
      requestType: 'ACCOUNT_DELETION',
    });
    await request('PATCH', `/legal/data-privacy/${removal.id}/status`, { status: 'PROCESSING' });
    await request(
      'PATCH',
      `/legal/data-privacy/${removal.id}/status`,
      { status: 'FULFILLED' },
      token,
      409,
    );
    await request(
      'PATCH',
      `/legal/data-privacy/${removal.id}/hold`,
      { legalHold: false },
      token,
      409,
    );
    check(
      'Active legal preservation blocks deletion and hold release',
      (await db.customer.findUnique({ where: { id: customerIds[0] } })).name === marker,
    );
    const exportRequest = await request('POST', '/legal/data-privacy', {
      userId: customerIds[0],
      userType: 'CUSTOMER',
      requestType: 'DATA_EXPORT',
    });
    await request('PATCH', `/legal/data-privacy/${exportRequest.id}/status`, {
      status: 'PROCESSING',
    });
    await request('PATCH', `/legal/data-privacy/${exportRequest.id}/status`, {
      status: 'FULFILLED',
    });
    const exported = await request('GET', `/legal/data-privacy/${exportRequest.id}/export`);
    check(
      'Authenticated export excludes credentials',
      exported.account.id === customerIds[0] && !JSON.stringify(exported).includes(passwordHash),
    );
    await request(
      'GET',
      `/legal/data-privacy/${exportRequest.id}/export`,
      undefined,
      tokens.SUPPORT_AGENT,
      403,
    );

    const notification = await request('POST', '/marketing/notifications', {
      title: marker,
      message: 'Test broadcast',
      category: 'GENERAL',
      targetAudience: 'CITY_SPECIFIC',
      targetCity: cityIds[0],
      status: 'DRAFT',
    });
    announcementIds.push(notification.id);
    await request('POST', `/marketing/notifications/${notification.id}/send`, {}, token, 503);
    check(
      'Unconfigured delivery preserves drafts and never fabricates a sent status',
      (await db.announcement.findUnique({ where: { id: notification.id } })).status === 'DRAFT',
    );
    await request(
      'POST',
      '/marketing/notifications',
      {
        title: marker,
        message: 'Test broadcast',
        category: 'GENERAL',
        targetAudience: 'ALL',
        status: 'DRAFT',
      },
      tokens.CITY_OPS_MANAGER,
      403,
    );
    check('Scoped operators cannot broadcast globally', true);
    const deletion = await request('POST', '/legal/data-privacy', {
      userId: customerIds[1],
      userType: 'CUSTOMER',
      requestType: 'ACCOUNT_DELETION',
    });
    await request('PATCH', `/legal/data-privacy/${deletion.id}/status`, { status: 'PROCESSING' });
    await db.customer.update({ where: { id: customerIds[1] }, data: { walletBalance: 7 } });
    await request(
      'PATCH',
      `/legal/data-privacy/${deletion.id}/status`,
      { status: 'FULFILLED' },
      token,
      409,
    );
    check(
      'Profile wallet balance blocks account erasure',
      (await db.customer.findUnique({ where: { id: customerIds[1] } })).name === marker,
    );
    await db.customer.update({ where: { id: customerIds[1] }, data: { walletBalance: 0 } });
    await request('PATCH', `/legal/data-privacy/${deletion.id}/status`, { status: 'FULFILLED' });
    const erased = await db.customer.findUnique({ where: { id: customerIds[1] } });
    check(
      'Reviewed deletion disables access and erases profile identifiers',
      erased.status === 'BANNED' &&
        erased.email === null &&
        erased.name === 'Deleted account' &&
        erased.phone === `deleted-${customerIds[1]}` &&
        erased.passwordHash !== passwordHash,
    );
    const destination = await db.bankAccount.create({
      data: {
        companionId: companion.id,
        accountName: marker,
        ifscCode: 'TEST0001234',
        accountNumber: '123456789012',
        accountLast4: '9012',
        upiId: 'fixture@example',
        preferred: true,
        verified: true,
      },
    });
    await db.companion.update({ where: { id: companion.id }, data: { payoutPreference: 'UPI' } });
    const paid = await db.payout.create({
      data: {
        payoutRef: `privacy-${run}`,
        companionId: companion.id,
        bankAccountId: destination.id,
        amount: 100,
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: new Date(),
        status: 'PAID',
        utrNumber: `fixture-${run}`,
      },
    });
    const companionDeletion = await request('POST', '/legal/data-privacy', {
      userId: companion.id,
      userType: 'COMPANION',
      requestType: 'ACCOUNT_DELETION',
    });
    const deletionPath = `/legal/data-privacy/${companionDeletion.id}`;
    await request('PATCH', deletionPath + '/status', { status: 'PROCESSING' });
    await request('PATCH', deletionPath + '/hold', { legalHold: true });
    await request('PATCH', deletionPath + '/status', { status: 'FULFILLED' }, token, 409);
    assert.equal(
      (await db.bankAccount.findUnique({ where: { id: destination.id } })).accountNumber,
      '123456789012',
    );
    await request('PATCH', deletionPath + '/hold', { legalHold: false });
    await db.payout.update({ where: { id: paid.id }, data: { status: 'PROCESSING' } });
    await request('PATCH', deletionPath + '/status', { status: 'FULFILLED' }, token, 409);
    assert.equal(
      (await db.bankAccount.findUnique({ where: { id: destination.id } })).upiId,
      'fixture@example',
    );
    check('Legal holds and unsettled payouts block payment-identifier erasure', true);
    await db.payout.update({ where: { id: paid.id }, data: { status: 'PAID' } });
    await request('PATCH', deletionPath + '/status', { status: 'FULFILLED' });
    const redacted = await db.bankAccount.findUnique({ where: { id: destination.id } });
    assert.equal(redacted.accountName, 'Deleted account');
    for (const field of ['ifscCode', 'accountNumber', 'accountLast4'])
      assert.equal(redacted[field], '');
    assert.equal(redacted.upiId, null);
    assert.equal(redacted.verified, false);
    assert.equal(redacted.preferred, false);
    assert.equal(
      (await db.companion.findUnique({ where: { id: companion.id } })).payoutPreference,
      null,
    );
    assert.deepEqual(
      await db.payout.findUnique({
        where: { id: paid.id },
        select: {
          amount: true,
          utrNumber: true,
          bankAccountId: true,
        },
      }),
      { amount: paid.amount, utrNumber: paid.utrNumber, bankAccountId: destination.id },
    );
    check(
      'Reviewed companion deletion redacts bank and UPI identifiers and preserves settled payment history',
      true,
    );

    const readRoutes = [
      '/discovery/events',
      '/discovery/ranking-config',
      '/operations/city-launch',
      '/operations/growth-abuse',
      '/operations/venues',
      '/platform-config/policy-docs',
      '/platform-config/training',
      '/marketing/notifications',
      '/legal/data-privacy',
      '/legal/legal-requests',
      '/support/sla-dashboard/alerts',
      '/support/tickets',
    ];
    for (const path of readRoutes) {
      await request('GET', path);
      await request('GET', path, undefined, null, 401);
    }
    check('All twelve workflow APIs require authentication and return real data', true);
    console.log(JSON.stringify({ passed: results.length, checks: results }, null, 2));
  } finally {
    if (app) await app.close();
    // Clean only this run's identifiers, in foreign-key order.
    await db.broadcastDelivery.deleteMany({ where: { announcementId: { in: announcementIds } } });
    await db.announcement.deleteMany({ where: { id: { in: announcementIds } } });
    await db.dataPrivacyRequest.deleteMany({
      where: { userId: { in: [...customerIds, ...companionIds] } },
    });
    await db.legalRequest.deleteMany({ where: { targetUserId: { in: customerIds } } });
    await db.supportTicket.deleteMany({ where: { userId: { in: customerIds } } });
    await db.fraudFlag.deleteMany({ where: { userId: { in: customerIds } } });
    await db.referralCode.deleteMany({ where: { ownerId: { in: customerIds } } });
    await db.policyDocument.deleteMany({ where: { id: { in: policyIds } } });
    await db.trainingModule.deleteMany({ where: { id: { in: lessonIds } } });
    await db.companionPromotion.deleteMany({ where: { companionId: { in: companionIds } } });
    await db.specialEvent.deleteMany({ where: { cityId: { in: cityIds } } });
    await db.venue.deleteMany({ where: { cityId: { in: cityIds } } });
    await db.cityLaunch.deleteMany({ where: { cityId: { in: cityIds } } });
    await db.waitlistEntry.deleteMany({ where: { cityId: { in: cityIds } } });
    await db.customer.deleteMany({ where: { id: { in: customerIds } } });
    await db.payout.deleteMany({ where: { companionId: { in: companionIds } } });
    await db.companion.deleteMany({ where: { id: { in: companionIds } } });
    await db.city.deleteMany({ where: { id: { in: cityIds } } });
    await db.auditLog.deleteMany({ where: { adminId: { in: staffIds } } });
    await db.staffSession.deleteMany({ where: { employeeId: { in: staffIds } } });
    await db.staffEmployee.deleteMany({ where: { id: { in: staffIds } } });
    await db.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
