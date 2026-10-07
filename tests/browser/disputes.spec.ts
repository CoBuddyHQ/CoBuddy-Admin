import { test, expect, type Page } from '@playwright/test';

async function setup(page: Page) {
  const state = {
    fail: false,
    failWrite: false,
    writes: [] as Record<string, unknown>[],
    dispute: {
      id: 'dispute-one',
      version: 0,
      bookingId: 'booking-one',
      raisedBy: 'CUSTOMER',
      disputeReasonId: 'cancellation',
      description: 'Cancellation review',
      workflowStatus: 'OPEN',
      refundAmount: null as string | null,
      overridePercent: null as number | null,
      overrideReason: null as string | null,
      createdAt: '2026-10-01T00:00:00Z',
      booking: {
        bookingRef: 'BOOK-ONE',
        bookingAmount: '100.00',
        customer: { id: 'customer' },
        companion: { id: 'companion' },
      },
    },
  };
  await page.addInitScript(() => localStorage.setItem('admin_token', 'dispute-fixture'));
  await page.route(
    (url) =>
      url.pathname.startsWith('/api/') &&
      ['localhost', '127.0.0.1', 'api.example.invalid'].includes(url.hostname),
    async (route) => {
      const path = new URL(route.request().url()).pathname;
      const respond = (data: unknown, status = 200) =>
        route.fulfill({ status, json: { data }, headers: { 'access-control-allow-origin': '*' } });
      if (path === '/api/auth/me')
        return respond({
          id: 'support-test',
          name: 'Support',
          email: 'support@example.invalid',
          roles: ['SUPPORT_AGENT'],
          cityScopeIds: [],
        });
      if (path.startsWith('/api/financial/'))
        throw new Error('Support dispute view must not load finance settings');
      if (path === '/api/bookings/disputes')
        return respond(state.fail ? null : [state.dispute], state.fail ? 503 : 200);
      if (path.startsWith('/api/bookings/disputes/')) {
        const body = route.request().postDataJSON();
        state.writes.push(body);
        if (state.failWrite) return respond(null, 503);
        expect(body.version).toBe(state.dispute.version);
        if (path.endsWith('/penalty-override')) {
          state.dispute.overridePercent = body.percent;
          state.dispute.overrideReason = body.reason;
          state.dispute.refundAmount = Number(body.percent).toFixed(2);
        } else state.dispute.workflowStatus = body.status;
        state.dispute.version++;
        return respond(state.dispute);
      }
      return respond([]);
    },
  );
  return state;
}

test('support can review an override and request finance processing, not mark a refund paid', async ({
  page,
}, testInfo) => {
  const state = await setup(page);
  await page.goto('/bookings/disputes');
  await expect(page.getByRole('button', { name: 'Request Refund' })).toBeDisabled();
  await page.getByRole('button', { name: 'Set Refund', exact: true }).click();
  await page.getByLabel('Refund Percentage (0-100)').fill('25');
  await page.getByLabel('Reason', { exact: true }).fill('Evidence reviewed');
  await page.getByRole('button', { name: 'Save Refund Amount' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('25%', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Request Refund' }).click();
  expect(state.writes).toHaveLength(1);
  await expect(page.getByRole('dialog')).toContainText('wallet refund');
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('REFUND PENDING', { exact: true })).toBeVisible();
  expect(state.writes[1].status).toBe('REFUND_PENDING');
  await expect(page.getByRole('button', { name: 'Request Refund' })).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath('dispute-refund-pending.png'),
    fullPage: true,
  });
});

test('failed dispute writes keep the form and values available for retry', async ({ page }) => {
  const state = await setup(page);
  state.failWrite = true;
  await page.goto('/bookings/disputes');
  await page.getByRole('button', { name: 'Set Refund', exact: true }).click();
  await page.getByLabel('Refund Percentage (0-100)').fill('25');
  await page.getByLabel('Reason', { exact: true }).fill('Evidence reviewed');
  await page.getByRole('button', { name: 'Save Refund Amount' }).click();
  await expect(
    page.getByText('Could not update refund amount. Refresh and try again.'),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByLabel('Refund Percentage (0-100)')).toHaveValue('25');
});

test('a dispute outage shows an error rather than an empty queue', async ({ page }) => {
  const state = await setup(page);
  state.fail = true;
  await page.goto('/bookings/disputes');
  await expect(page.getByText('Could not load disputes.')).toBeVisible();
  await expect(page.getByText('No disputes found.')).toHaveCount(0);
  state.fail = false;
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByText('BOOK-ONE', { exact: true })).toBeVisible();
});
