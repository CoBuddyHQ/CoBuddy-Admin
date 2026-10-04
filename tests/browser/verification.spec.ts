import { expect, test, type Page } from '@playwright/test';

const image =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
const caseFixture = (id = 'CASE-TEST') => ({
  id,
  caseRef: id,
  applicantId: 'customer-test',
  applicantName: 'Test Applicant',
  applicantType: 'CUSTOMER',
  faceMatchScore: null,
  livenessPass: null,
  documentValid: null,
  status: 'PENDING_MANUAL_REVIEW',
  submittedAt: '2026-01-01',
  documentType: 'PASSPORT',
  auditTrail: [],
  idDocumentUrl: image,
  selfieUrl: image,
});

async function setup(page: Page, roles = ['MODERATOR']) {
  const state = {
    failQueue: false,
    failDecision: false,
    failSettings: false,
    failSave: false,
    status: 'PENDING_MANUAL_REVIEW',
    decisions: [] as Record<string, unknown>[],
    writes: [] as Record<string, unknown>[],
    queueRequests: 0,
    settings: {
      id: 'singleton',
      updatedAt: '2026-01-01',
      autoApproveThreshold: 90,
      autoRejectThreshold: 30,
      livenessRequired: true,
      enabledProvider: 'HYPERVERGE',
    },
  };
  await page.addInitScript(() => {
    localStorage.setItem('admin_token', 'verification-test-access');
    localStorage.setItem('admin_refresh_token', 'verification-test-refresh');
  });
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^.*\/api/, '');
    const respond = (data: unknown, meta?: unknown) =>
      route.fulfill({
        json: { data, ...(meta ? { meta } : {}) },
        headers: { 'access-control-allow-origin': '*' },
      });
    const fail = (message: string) =>
      route.fulfill({
        status: 503,
        json: { error: { message } },
        headers: { 'access-control-allow-origin': '*' },
      });
    if (path === '/auth/me')
      return respond({
        id: 'moderator-test',
        name: 'Moderator',
        email: 'moderator@example.invalid',
        roles,
        cityScopeIds: [],
      });
    if (path === '/verification/cases') {
      state.queueRequests++;
      const pageSize = Number(url.searchParams.get('pageSize'));
      if (state.failQueue && pageSize !== 1) return fail('Queue temporarily unavailable');
      const current = Number(url.searchParams.get('page') || 1);
      const filteredOut =
        !!url.searchParams.get('status') && url.searchParams.get('status') !== state.status;
      return respond(
        filteredOut
          ? []
          : [{ ...caseFixture(current === 1 ? 'CASE-TEST' : 'CASE-PAGE-2'), status: state.status }],
        {
          page: current,
          pageSize,
          totalItems: filteredOut ? 0 : 21,
          totalPages: filteredOut ? 0 : Math.ceil(21 / pageSize),
          hasNext: !filteredOut && current * pageSize < 21,
          hasPrevious: current > 1,
        },
      );
    }
    if (path.endsWith('/decision')) {
      const payload = route.request().postDataJSON();
      state.decisions.push(payload);
      if (state.failDecision) return fail('Review could not be saved');
      state.status = payload.decision;
      return respond({ ...caseFixture(), status: state.status });
    }
    if (path === '/verification/thresholds') {
      if (route.request().method() === 'PUT') {
        const payload = route.request().postDataJSON();
        state.writes.push(payload);
        if (state.failSave) return fail('Settings temporarily unavailable');
        state.settings = { ...state.settings, ...payload };
        return respond(state.settings);
      }
      if (state.failSettings) return fail('Settings temporarily unavailable');
      return respond(state.settings);
    }
    return respond([]);
  });
  return state;
}

async function expectNoOverflow(page: Page) {
  expect(
    await page
      .locator('main')
      .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
  ).toBeTruthy();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
}

test('verification distinguishes missing evidence and supports accessible, responsive detail navigation', async ({
  page,
}, info) => {
  await setup(page);
  await page.goto('/verification');
  await expect(page.getByText('Face: Not checked', { exact: true })).toBeVisible();
  await expect(page.getByText('Liveness: Not checked', { exact: true })).toBeVisible();
  await expect(page.getByText('Doc: Not checked', { exact: true })).toBeVisible();
  await expectNoOverflow(page);
  await page.getByRole('button', { name: 'Review CASE-TEST', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Not checked', { exact: true })).toHaveCount(3);
  await expect(page.getByText('Failed', { exact: true })).toHaveCount(0);
  await expectNoOverflow(page);
  await page.screenshot({ path: info.outputPath('verification-detail.png'), fullPage: true });
  await page.getByRole('button', { name: 'Back to verification queue' }).click();
  await expect(page.getByRole('heading', { name: 'Verification Queue' })).toBeVisible();
});

test('verification queue exposes server pagination and resets it when a status changes', async ({
  page,
}) => {
  await setup(page);
  await page.goto('/verification');
  await expect(page.getByText('21 cases', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next verification page' }).click();
  await expect(page.getByRole('button', { name: 'Review CASE-PAGE-2' })).toBeVisible();
  await expect(page.getByText('Page 2 of 2', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next verification page' })).toBeDisabled();
  await page
    .getByRole('combobox', { name: 'Verification status' })
    .selectOption('REQUEST_RESUBMISSION');
  await expect(page.getByText('No verification cases found.', { exact: true })).toBeVisible();
  await expect(page.getByText('Page 1 of 1', { exact: true })).toBeVisible();
});

test('a failed queue is distinct from an empty queue and can be retried', async ({ page }) => {
  const state = await setup(page);
  state.failQueue = true;
  await page.goto('/verification');
  await expect(page.getByText('Unable to load verification cases.', { exact: true })).toBeVisible();
  await expect(page.getByText('No verification cases found.', { exact: true })).toHaveCount(0);
  state.failQueue = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Review CASE-TEST' })).toBeVisible();
});

test('reviewing the final visible case moves an exhausted page back into range', async ({
  page,
}) => {
  await setup(page);
  await page.goto('/verification');
  await page.getByRole('button', { name: 'Next verification page' }).click();
  await page.getByRole('button', { name: 'Review CASE-PAGE-2' }).click();
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm decision' }).click();
  await expect(page.getByText('Page 1 of 1', { exact: true })).toBeVisible();
  await expect(page.getByText('No verification cases found.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous verification page' })).toBeDisabled();
});

test('manual approval requires explicit confirmation and updates the queue', async ({ page }) => {
  const state = await setup(page);
  await page.goto('/verification');
  await page.getByRole('button', { name: 'Review CASE-TEST' }).click();
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(state.decisions).toHaveLength(0);
  await page.getByLabel('Review note (optional)').fill('Identity evidence reviewed');
  await page.getByRole('button', { name: 'Confirm decision' }).click();
  await expect(page.getByText('No verification cases found.', { exact: true })).toBeVisible();
  expect(state.decisions).toEqual([{ decision: 'APPROVED', notes: 'Identity evidence reviewed' }]);
});

test('rejection requires a reason and failed writes preserve the review draft', async ({
  page,
}) => {
  const state = await setup(page);
  state.failDecision = true;
  await page.goto('/verification');
  await page.getByRole('button', { name: 'Review CASE-TEST' }).click();
  await page.getByRole('button', { name: 'Reject', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Confirm decision' })).toBeDisabled();
  await dialog.getByLabel('Reason', { exact: true }).fill('  Document expired  ');
  await dialog.getByRole('button', { name: 'Confirm decision' }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Review could not be saved');
  await expect(dialog.getByLabel('Reason', { exact: true })).toHaveValue('  Document expired  ');
  state.failDecision = false;
  await dialog.getByRole('button', { name: 'Confirm decision' }).click();
  await expect(dialog).not.toBeVisible();
  expect(state.decisions[1]).toEqual({
    decision: 'REJECTED',
    reason: 'Document expired',
    notes: 'Document expired',
  });
});

test('settings validate thresholds and strip server-only metadata before saving', async ({
  page,
}, info) => {
  const state = await setup(page);
  await page.goto('/verification/settings');
  await expect(page.getByText('Provider unavailable', { exact: true })).toBeVisible();
  const approve = page.getByLabel('Auto-approve threshold (%)', { exact: true });
  const reject = page.getByLabel('Auto-reject threshold (%)', { exact: true });
  const save = page.getByRole('button', { name: 'Save settings', exact: true });
  await expect(save).toBeDisabled();
  await reject.fill('95');
  await expect(save).toBeDisabled();
  await expect(
    page.getByText('Thresholds must be whole percentages', { exact: false }),
  ).toBeVisible();
  await reject.fill('35');
  await approve.fill('85');
  await page.getByRole('switch', { name: 'Require liveness pass' }).click();
  await expectNoOverflow(page);
  await page.screenshot({ path: info.outputPath('verification-settings.png'), fullPage: true });
  await save.click();
  await expect(save).toBeDisabled();
  expect(state.writes).toEqual([
    {
      autoApproveThreshold: 85,
      autoRejectThreshold: 35,
      livenessRequired: false,
      enabledProvider: 'HYPERVERGE',
    },
  ]);
});

test('settings load failures cannot silently save default values', async ({ page }) => {
  const state = await setup(page);
  state.failSettings = true;
  await page.goto('/verification/settings');
  await expect(
    page.getByText('Unable to load verification settings.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save settings' })).toHaveCount(0);
  state.failSettings = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByLabel('Auto-approve threshold (%)', { exact: true })).toHaveValue('90');
});

test('settings retain an unsaved draft after a failed write and allow retry', async ({ page }) => {
  const state = await setup(page);
  state.failSave = true;
  await page.goto('/verification/settings');
  const approve = page.getByLabel('Auto-approve threshold (%)', { exact: true });
  await approve.fill('88');
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect(page.locator('form').getByRole('alert')).toHaveText(
    'Settings temporarily unavailable',
  );
  await expect(approve).toHaveValue('88');
  state.failSave = false;
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect(page.getByRole('button', { name: 'Save settings' })).toBeDisabled();
  expect(state.writes).toHaveLength(2);
});

test('staff without verification permission cannot mount queue queries or review controls', async ({
  page,
}) => {
  const state = await setup(page, ['FINANCE_ADMIN']);
  await page.goto('/verification');
  await expect(
    page.getByText('You do not have access to verification.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review CASE-TEST' })).toHaveCount(0);
  expect(state.queueRequests).toBe(0);
});
