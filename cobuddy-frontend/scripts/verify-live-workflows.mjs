/* Builds and tests against local PostgreSQL/Redis, without HTTP response fixtures. */
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { chromium, expect } from '@playwright/test';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendEnvironment = { ...process.env };
const backendDirectory = process.env.COBUDDY_BACKEND_DIR
  ? path.resolve(process.env.COBUDDY_BACKEND_DIR)
  : [
      path.resolve(__dirname, '../../CoBuddy-Admin-Backend'),
      path.resolve(__dirname, '../../cobuddy-backend'),
    ].find((directory) => fs.existsSync(path.join(directory, 'package.json')));
if (!backendDirectory) {
  throw new Error('Clone the backend and set COBUDDY_BACKEND_DIR to its directory.');
}
const requireBackend = createRequire(path.join(backendDirectory, 'package.json'));
const dotenv = requireBackend('dotenv');
const { PrismaClient } = requireBackend('@prisma/client');
const bcrypt = requireBackend('bcrypt');
dotenv.config({ path: path.join(backendDirectory, '.env') });

async function buildFrontend(apiUrl) {
  const logPath = path.join(
    __dirname,
    '../test-results/live-workflows',
    apiUrl ? 'build.log' : 'restore-build.log',
  );
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  const log = fs.openSync(logPath, 'w');
  console.log(
    apiUrl
      ? 'Building frontend against the isolated test API...'
      : 'Restoring frontend build with your normal environment...',
  );
  try {
    await new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [path.join(__dirname, '../node_modules/next/dist/bin/next'), 'build'],
        {
          cwd: path.join(__dirname, '..'),
          env: {
            ...frontendEnvironment,
            NODE_ENV: 'production',
            NEXT_TELEMETRY_DISABLED: '1',
            ...(apiUrl ? { NEXT_PUBLIC_API_URL: apiUrl } : {}),
          },
          windowsHide: true,
          stdio: ['ignore', log, log],
        },
      );
      child.once('error', reject);
      child.once('exit', (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`Frontend build failed (${code}); see ${logPath}`)),
      );
    });
  } finally {
    fs.closeSync(log);
  }
}

async function closeTestApi(app) {
  const server = app.getHttpServer();
  // Local editor previews may hold preconnected sockets without sending requests.
  const forceClose = setInterval(() => server.closeAllConnections(), 250);
  try {
    await app.close();
  } finally {
    clearInterval(forceClose);
  }
}

async function main() {
  if (
    ['production', 'staging'].includes(process.env.NODE_ENV) ||
    !['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname)
  )
    throw new Error('Use a local development database only.');
  process.env.NODE_ENV = 'test';
  process.env.CORS_ORIGIN = 'http://127.0.0.1:3108';
  delete process.env.NOTIFICATION_DELIVERY_URL;
  delete process.env.NOTIFICATION_DELIVERY_TOKEN;
  const db = new PrismaClient();
  const run = randomUUID();
  let city, staff, applicationFixture, companionFixture, ruleId, app, browser, preview;
  let frontendBuildChanged = false;
  const password = randomBytes(24).toString('base64url');
  try {
    city = await db.city.create({
      data: {
        cityCode: `LIVE-${run}`,
        name: { en: 'Live workflow fixture' },
        state: 'Test region',
      },
    });
    staff = await db.staffEmployee.create({
      data: {
        employeeId: `LIVE-${run}`,
        name: 'Live workflow fixture',
        email: `${run}@example.invalid`,
        passwordHash: await bcrypt.hash(password, 10),
        roles: ['SUPER_ADMIN'],
        cityScopeIds: [],
        designation: 'Live integration fixture',
        department: 'ENGINEERING',
        status: 'ACTIVE',
        inviteStatus: 'ACCEPTED',
      },
    });
    applicationFixture = await db.companionApplication.create({
      data: {
        firstName: 'Live',
        lastName: 'Applicant',
        phone: `live-${run}`,
        cityId: city.id,
        portfolioUrls: [],
        applicationStatus: 'PENDING',
      },
    });
    companionFixture = await db.companion.create({
      data: {
        name: `Live companion ${run}`,
        phone: `companion-${run}`,
        passwordHash: await bcrypt.hash(password, 10),
        gender: 'UNSPECIFIED',
        cityId: city.id,
        status: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        trustScore: 61,
        spokenLanguageIds: [],
        interestIds: [],
        communicationStyleCodes: [],
        activityPaceCodes: [],
      },
    });
    const { createApplication } = await import(
      pathToFileURL(path.join(backendDirectory, 'dist/src/main.js')).href
    );
    app = await createApplication();
    app.useLogger(false);
    await app.listen(0, '127.0.0.1');
    const apiPort = app.getHttpServer().address().port;
    const apiUrl = `http://127.0.0.1:${apiPort}/api`;
    frontendBuildChanged = true;
    await buildFrontend(apiUrl);
    preview = spawn(process.execPath, [path.join(__dirname, 'start-preview.mjs')], {
      cwd: path.join(__dirname, '..'),
      env: { ...frontendEnvironment, NODE_ENV: 'production', PORT: '3108', HOSTNAME: '127.0.0.1' },
      windowsHide: true,
      stdio: 'ignore',
    });
    preview.on('error', () => {});
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const failures = [];
    page.on('pageerror', (error) => failures.push(error.message));
    page.on('requestfailed', (request) => {
      console.error(
        'Request failed:',
        request.method(),
        new URL(request.url()).pathname,
        request.failure()?.errorText,
      );
    });
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        ready = (await fetch('http://127.0.0.1:3108/login')).ok;
      } catch {}
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (!ready) throw new Error('Preview server did not start');
    await page.goto('http://127.0.0.1:3108/login');
    await expect(page.getByLabel('Email', { exact: true })).toBeEnabled();
    await page.getByLabel('Email', { exact: true }).fill(staff.email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    const loginResponse = page.waitForResponse((response) =>
      response.url().endsWith('/api/auth/login'),
    );
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    if (!(await loginResponse).ok()) throw new Error('Actual backend login failed');
    await expect(page).not.toHaveURL(/\/login$/);
    await page.goto('http://127.0.0.1:3108/discovery/events');
    await page.getByRole('button', { name: 'Create Event', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('City', { exact: true }).selectOption(city.id);
    await dialog.getByPlaceholder("e.g. Valentine's Week").fill(`Live event ${run}`);
    await dialog
      .getByPlaceholder('Short description for the banner...')
      .fill('Persisted through the real browser, JWT API, and PostgreSQL.');
    await dialog.locator('input[type=date]').nth(0).fill('2027-01-01');
    await dialog.locator('input[type=date]').nth(1).fill('2027-01-02');
    await dialog.getByRole('button', { name: 'Create Event', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText(`Live event ${run}`, { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText(`Live event ${run}`, { exact: true })).toBeVisible();
    const event = await db.specialEvent.findFirst({ where: { cityId: city.id } });
    if (!event || event.title.en !== `Live event ${run}`)
      throw new Error('Browser save did not persist');
    const screenshot = path.join(__dirname, '../test-results/audit-repair/live-event.png');
    fs.mkdirSync(path.dirname(screenshot), { recursive: true });
    await page.screenshot({ path: screenshot, fullPage: true });
    await page.goto('http://127.0.0.1:3108/companion-applications');
    await expect(page.getByText('Live Applicant', { exact: true })).toBeVisible();
    await page.goto('http://127.0.0.1:3108/companion-applications/' + applicationFixture.id);
    await expect(page.getByText('Invalid Date')).toHaveCount(0);
    await page.getByRole('button', { name: 'Assign To Me', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Approve Companion', exact: true }),
    ).toBeVisible();
    const claimed = await db.companionApplication.findUniqueOrThrow({
      where: { id: applicationFixture.id },
    });
    if (claimed.reviewedByStaffId !== staff.id || claimed.applicationStatus !== 'SCREENING')
      throw new Error('Application assignment did not persist the actual signed-in reviewer');
    await page.reload();
    await expect(
      page.getByRole('button', { name: 'Approve Companion', exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: path.join(path.dirname(screenshot), 'live-assignment.png'),
      fullPage: true,
    });
    await page
      .getByPlaceholder('Interview notes / Decision rationale...')
      .fill('Live waitlist decision');
    await page.getByRole('button', { name: 'Add to Waitlist', exact: true }).click();
    await expect(page.getByText('WAITLISTED', { exact: true })).toBeVisible();
    const ruleResponse = await page.evaluate(
      async ({ marker, apiUrl }) => {
        const response = await fetch(apiUrl + '/trust-score/rules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + localStorage.getItem('admin_token'),
          },
          body: JSON.stringify({
            trigger: marker,
            category: 'integration-test',
            delta: 7,
            description: marker,
          }),
        });
        if (!response.ok) throw new Error('Rule creation failed: ' + response.status);
        return response.json();
      },
      { marker: 'Live rule ' + run, apiUrl },
    );
    ruleId = ruleResponse.data.id;
    await page.goto('http://127.0.0.1:3108/trust-score');
    const ruleRow = page
      .getByText('Live rule ' + run, { exact: true })
      .locator('..')
      .locator('..');
    await ruleRow.getByRole('switch').click();
    await expect
      .poll(
        async () => (await db.appConfig.findUniqueOrThrow({ where: { id: ruleId } })).value.enabled,
      )
      .toBe(false);
    // Restart the actual API to distinguish database persistence from an in-memory store.
    await page.goto('about:blank');
    await closeTestApi(app);
    app = await createApplication();
    app.useLogger(false);
    await app.listen(apiPort, '127.0.0.1');
    await page.goto('http://127.0.0.1:3108/trust-score');
    await expect(ruleRow.getByRole('switch')).not.toBeChecked();
    await page.goto('http://127.0.0.1:3108/trust-score/' + companionFixture.id);
    await expect(
      page.getByRole('heading', { name: 'Trust Score: ' + companionFixture.name, exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Not measured', { exact: true })).toHaveCount(3);
    await page.getByRole('button', { name: 'Manual Override', exact: true }).click();
    await page.getByPlaceholder('New Score (0-100)').fill('86');
    await page.getByPlaceholder('Justification for override').fill('Live persisted override');
    await page.getByRole('button', { name: 'Apply Override', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect
      .poll(
        async () =>
          (await db.companion.findUniqueOrThrow({ where: { id: companionFixture.id } })).trustScore,
      )
      .toBe(86);
    await page.reload();
    await expect(page.getByText('Changed to 86 (from 61)', { exact: true })).toBeVisible();
    await page.screenshot({
      path: path.join(path.dirname(screenshot), 'live-trust-score.png'),
      fullPage: true,
    });
    for (const [route, heading] of [
      ['/support/tickets', 'Support Tickets'],
      ['/operations/venues', 'Venue Management'],
      ['/legal/data-privacy', 'Data Privacy & Deletion Requests'],
    ]) {
      await page.goto('http://127.0.0.1:3108' + route);
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }
    if (failures.length) throw new Error(`Browser errors: ${failures.join('; ')}`);
    fs.writeFileSync(
      path.join(__dirname, '../test-results/live-workflows/result.json'),
      JSON.stringify(
        {
          completedAt: new Date().toISOString(),
          passed: true,
          httpResponseMocks: false,
          checks: [
            'login/JWT',
            'event save and reload',
            'application queue with legacy pending status',
            'assignment and reviewer persistence',
            'waitlist decision',
            'trust rule across API restart',
            'score override and reload',
            'support',
            'venues',
            'privacy',
            'no browser errors',
          ],
        },
        null,
        2,
      ),
    );
    console.log(
      'PASS: real login/JWT, event save/reload, application assignment/reviewer persistence/reload/waitlist, trust rule persistence across API restart, exact score override/reload, support, venues and privacy; no browser errors.',
    );
  } finally {
    try {
      if (browser) await browser.close();
      if (preview) {
        preview.kill();
        await new Promise((resolve) => {
          if (preview.exitCode !== null) return resolve();
          preview.once('exit', resolve);
          setTimeout(resolve, 3000);
        });
      }
      if (app) await closeTestApi(app);
      if (applicationFixture)
        await db.companionApplication.delete({ where: { id: applicationFixture.id } });
      if (ruleId) await db.appConfig.deleteMany({ where: { id: ruleId } });
      if (companionFixture) {
        await db.trustScoreHistoryEntry.deleteMany({ where: { companionId: companionFixture.id } });
        await db.companion.delete({ where: { id: companionFixture.id } });
      }
      if (city) {
        await db.specialEvent.deleteMany({ where: { cityId: city.id } });
        await db.city.delete({ where: { id: city.id } });
      }
      if (staff) {
        await db.auditLog.deleteMany({ where: { adminId: staff.id } });
        await db.staffEmployee.delete({ where: { id: staff.id } });
      }
      await db.$disconnect();
    } finally {
      if (frontendBuildChanged) await buildFrontend();
    }
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
