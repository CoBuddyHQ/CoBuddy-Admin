/* Actual HTTP/database regression for the application's assignment and decision lifecycle. */
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
  const staff = [],
    ineligibleStaff = [],
    cities = [],
    applications = [],
    companions = [];
  let app;
  const checks = [];
  try {
    for (const n of [1, 2])
      cities.push(
        await db.city.create({
          data: {
            cityCode: `assignment-${run}-${n}`,
            name: { en: 'Assignment City' },
            state: 'Test',
          },
        }),
      );
    const password = randomBytes(24).toString('base64url');
    const passwordHash = await bcrypt.hash(password, 10);
    for (const n of [1, 2])
      staff.push(
        await db.staffEmployee.create({
          data: {
            employeeId: `assignment-${run}-${n}`,
            name: `Assignment Reviewer ${n}`,
            email: `assignment-${run}-${n}@example.invalid`,
            passwordHash,
            designation: 'Test',
            department: 'ENGINEERING',
            roles: ['MODERATOR'],
            cityScopeIds: [cities[0].id],
            status: 'ACTIVE',
            inviteStatus: 'ACCEPTED',
          },
        }),
      );
    for (const [index, overrides] of [
      { status: 'SUSPENDED' },
      { inviteStatus: 'PENDING' },
      { roles: ['SUPPORT_AGENT'] },
      { cityScopeIds: [cities[1].id] },
      { roles: ['MODERATOR', 'CITY_OPS_MANAGER'], cityScopeIds: [] },
    ].entries()) {
      ineligibleStaff.push(
        await db.staffEmployee.create({
          data: {
            employeeId: `ineligible-${run}-${index}`,
            name: 'Ineligible reviewer',
            email: `ineligible-${run}-${index}@example.invalid`,
            passwordHash,
            designation: 'Test',
            department: 'ENGINEERING',
            roles: ['MODERATOR'],
            cityScopeIds: [cities[0].id],
            status: 'ACTIVE',
            inviteStatus: 'ACCEPTED',
            ...overrides,
          },
        }),
      );
    }
    for (const [n, status, cityId] of [
      [1, 'PENDING', cities[0].id],
      [2, 'SUBMITTED', cities[0].id],
      [3, 'SUBMITTED', cities[1].id],
    ])
      applications.push(
        await db.companionApplication.create({
          data: {
            firstName: 'Assignment',
            lastName: 'Fixture',
            phone: `assignment-${run}-${n}`,
            cityId,
            portfolioUrls: [],
            applicationStatus: status,
          },
        }),
      );
    app = await createApplication();
    app.useLogger(false);
    await app.listen(0, '127.0.0.1');
    const base = `http://127.0.0.1:${app.getHttpServer().address().port}/api`;
    const request = async (method, path, token, body, expected) => {
      const response = await fetch(base + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const result = await response.json();
      if (expected !== undefined)
        assert.equal(
          response.status,
          expected,
          `${method} ${path}: ${JSON.stringify(result.error)}`,
        );
      return { status: response.status, data: result.data, meta: result.meta };
    };
    const tokens = [];
    for (const user of staff)
      tokens.push(
        (await request('POST', '/auth/login', null, { email: user.email, password }, 201)).data
          .accessToken,
      );
    const pendingPage1 = await request(
      'GET',
      '/companion-applications?status=SUBMITTED&pageSize=1&page=1',
      tokens[0],
      undefined,
      200,
    );
    const pendingPage2 = await request(
      'GET',
      '/companion-applications?status=SUBMITTED&pageSize=1&page=2',
      tokens[0],
      undefined,
      200,
    );
    assert.equal(pendingPage1.meta.totalItems, 2);
    assert.equal(pendingPage1.meta.hasNext, true);
    assert.equal(pendingPage2.meta.hasNext, false);
    assert.deepEqual(
      [pendingPage1.data[0].id, pendingPage2.data[0].id].sort(),
      applications
        .slice(0, 2)
        .map((a) => a.id)
        .sort(),
    );
    checks.push(
      'Server status filtering includes legacy pending rows and preserves accessible pagination',
    );
    const path = `/companion-applications/${applications[0].id}`;
    await request('POST', path + '/assign-self', null, undefined, 401);
    await request(
      'POST',
      `/companion-applications/${applications[2].id}/assign-self`,
      tokens[0],
      undefined,
      404,
    );
    const competing = await Promise.all(
      tokens.map((token) => request('POST', path + '/assign-self', token)),
    );
    assert.deepEqual(competing.map((r) => r.status).sort(), [201, 409]);
    const winner = competing.findIndex((r) => r.status === 201);
    const owner = tokens[winner],
      other = tokens[1 - winner];
    assert.equal(competing[winner].data.reviewedByStaffId, staff[winner].id);
    assert.equal(competing[winner].data.applicationStatus, 'SCREENING');
    await request('POST', path + '/assign-self', owner, undefined, 201);
    checks.push(
      'Authenticated, scoped assignment is atomic and idempotent; legacy PENDING records work',
    );
    const detail = (await request('GET', path, owner, undefined, 200)).data;
    assert.equal(detail.reviewedBy.name, staff[winner].name);
    assert.equal(detail.city.name.en, 'Assignment City');
    const list = (await request('GET', '/companion-applications', owner, undefined, 200)).data;
    assert(list.some((row) => row.id === detail.id && row.reviewedByStaffId === staff[winner].id));
    assert(!list.some((row) => row.id === applications[2].id));
    checks.push(
      'List and detail return persisted assignee and city labels within staff city scope',
    );
    const appointment = {
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      interviewerStaffId: staff[winner].id,
      meetingLink: 'https://meet.example.test/application-review',
    };
    await request('GET', path + '/interviewers', null, undefined, 401);
    await request(
      'GET',
      `/companion-applications/${applications[2].id}/interviewers`,
      owner,
      undefined,
      404,
    );
    const choices = (await request('GET', path + '/interviewers', owner, undefined, 200)).data;
    assert(choices.some((row) => row.id === staff[winner].id));
    assert(choices.every((row) => !('passwordHash' in row)));
    for (const excluded of ineligibleStaff) {
      assert(!choices.some((row) => row.id === excluded.id));
      await request(
        'POST',
        path + '/schedule-interview',
        owner,
        { ...appointment, interviewerStaffId: excluded.id },
        400,
      );
    }
    await request('POST', path + '/schedule-interview', null, appointment, 401);
    await request('POST', path + '/schedule-interview', other, appointment, 409);
    await request(
      'POST',
      path + '/schedule-interview',
      owner,
      { ...appointment, scheduledAt: '2000-01-01T00:00:00Z' },
      400,
    );
    await request(
      'POST',
      path + '/schedule-interview',
      owner,
      { ...appointment, meetingLink: 'javascript:alert(1)' },
      400,
    );
    await request('PATCH', path + '/status', owner, { status: 'INTERVIEW_SCHEDULED' }, 400);
    checks.push(
      'Interview scheduling requires authentication, city access, active eligible staff and valid future details',
    );
    await request('POST', path + '/schedule-interview', owner, appointment, 201);
    const scheduled = (await request('GET', path, owner, undefined, 200)).data;
    assert.equal(scheduled.applicationStatus, 'INTERVIEW_SCHEDULED');
    assert.deepEqual(scheduled.interview, {
      ...appointment,
      interviewer: { id: staff[winner].id, name: staff[winner].name },
    });
    const nextTime = new Date(Date.now() + 172800000).toISOString();
    await request(
      'POST',
      path + '/schedule-interview',
      owner,
      {
        scheduledAt: nextTime,
        interviewerStaffId: staff[winner].id,
      },
      201,
    );
    const rescheduled = (await request('GET', path, owner, undefined, 200)).data;
    assert.equal(rescheduled.interview.scheduledAt, nextTime);
    assert.equal(rescheduled.interview.meetingLink, null);
    checks.push(
      'Interview details persist through new HTTP reads and rescheduling clears a removed meeting link',
    );
    await request('PATCH', path + '/status', other, { status: 'WAITLISTED' }, 409);
    await request('PATCH', path + '/status', owner, { status: 'APPROVED' }, 400);
    await request(
      'PATCH',
      path + '/status',
      owner,
      { status: 'WAITLISTED', reviewNotes: 'Review later' },
      200,
    );
    const waitlist = await db.companionApplication.findUnique({
      where: { id: applications[0].id },
    });
    assert.equal(waitlist.applicationStatus, 'WAITLISTED');
    assert.equal(waitlist.reviewNotes, 'Review later');
    assert.equal(waitlist.reviewedByStaffId, null);
    assert.equal(waitlist.interviewScheduledAt, null);
    assert.equal(waitlist.interviewerStaffId, null);
    assert.equal(waitlist.interviewMeetingLink, null);
    await request('POST', path + '/assign-self', other, undefined, 201);
    await request(
      'POST',
      path + '/reject',
      other,
      { reason: 'Needs changes\n[photos] Blurry' },
      201,
    );
    await request('POST', path + '/assign-self', other, undefined, 409);
    await request('POST', path + '/schedule-interview', other, appointment, 409);
    checks.push(
      'Waitlist, reassignment and rejection persist notes; closed applications cannot be claimed',
    );
    const approvalPath = `/companion-applications/${applications[1].id}`;
    await request('POST', approvalPath + '/assign-self', owner, undefined, 201);
    const approved = (
      await request('POST', approvalPath + '/approve', owner, { notes: 'Interview passed' }, 201)
    ).data;
    companions.push(approved.companion.id);
    assert.equal(approved.application.reviewNotes, 'Interview passed');
    assert.equal(approved.application.applicationStatus, 'APPROVED');
    assert(!('passwordHash' in approved.companion));
    assert(await db.wallet.findUnique({ where: { companionId: approved.companion.id } }));
    await request('POST', approvalPath + '/approve', owner, { notes: 'Duplicate' }, 409);
    checks.push(
      'Approval creates one companion/wallet, stores decision notes, and rejects duplicate approval',
    );
    console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
  } finally {
    if (app) await app.close();
    const created = await db.companionApplication.findMany({
      where: { id: { in: applications.map((a) => a.id) } },
      select: { companionId: true },
    });
    const companionIds = [
      ...new Set([
        ...companions,
        ...created.flatMap((a) => (a.companionId ? [a.companionId] : [])),
      ]),
    ];
    await db.companionApplication.deleteMany({
      where: { id: { in: applications.map((a) => a.id) } },
    });
    await db.wallet.deleteMany({ where: { companionId: { in: companionIds } } });
    await db.companion.deleteMany({ where: { id: { in: companionIds } } });
    await db.auditLog.deleteMany({ where: { adminId: { in: staff.map((s) => s.id) } } });
    await db.staffEmployee.deleteMany({
      where: { id: { in: [...staff, ...ineligibleStaff].map((s) => s.id) } },
    });
    await db.city.deleteMany({ where: { id: { in: cities.map((c) => c.id) } } });
    await db.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
