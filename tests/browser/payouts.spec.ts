import { expect, test, type Page } from '@playwright/test';

async function fixture(
  page: Page,
  options: { failRead?: boolean; failWrite?: boolean; verified?: boolean } = {},
) {
  let status = 'ON_HOLD';
  const writes: { action: string; body: unknown }[] = [];
  const reads: URL[] = [];
  await page.addInitScript(() => {
    localStorage.setItem('admin_token', 'payout-test-token');
    localStorage.setItem('admin_refresh_token', 'payout-test-refresh');
  });
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^.*\/api/, '');
    if (path === '/auth/me')
      return route.fulfill({
        json: {
          data: {
            id: 'finance-test',
            name: 'Finance',
            email: 'finance@example.invalid',
            roles: ['FINANCE_ADMIN'],
            cityScopeIds: [],
          },
        },
      });
    if (path === '/financial/payouts') {
      reads.push(url);
      if (options.failRead)
        return route.fulfill({ status: 503, json: { error: { message: 'Unavailable' } } });
      return route.fulfill({
        json: {
          data: [
            {
              id: 'payout-test',
              payoutRef: 'PAY-TEST',
              companionId: 'companion-test',
              companion: { name: 'Test Companion' },
              amount: '100.25',
              periodStart: '2026-01-01',
              periodEnd: '2026-01-31',
              dueDate: '2026-02-01',
              status,
              holdReason: status === 'ON_HOLD' ? 'Account review' : null,
              bankAccount: {
                accountLast4: '1234',
                upiId: null,
                verified: options.verified !== false,
              },
            },
          ],
          meta: {
            page: Number(url.searchParams.get('page')),
            totalPages: 2,
            totalItems: 21,
            hasNext: url.searchParams.get('page') === '1',
          },
        },
      });
    }
    if (path.startsWith('/financial/payouts/')) {
      const action = path.split('/').at(-1)!;
      writes.push({ action, body: request.postDataJSON() });
      if (options.failWrite)
        return route.fulfill({
          status: 409,
          json: { error: { message: 'Payout changed; refresh before retrying.' } },
        });
      status =
        action === 'lift-hold'
          ? 'PENDING'
          : action === 'process'
            ? 'PROCESSING'
            : action === 'mark-paid'
              ? 'PAID'
              : 'ON_HOLD';
    }
    await route.fulfill({ json: { data: [] } });
  });
  return { writes, reads };
}

test('payout holds, payment references and pagination work without implying a bank transfer', async ({
  page,
}, testInfo) => {
  const { writes, reads } = await fixture(page);
  await page.goto('/financial/payouts');
  await expect(page.getByRole('heading', { name: 'Payout Records' })).toBeVisible();
  await expect(page.getByText('100.25', { exact: false })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('payouts.png'), fullPage: true });
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.getByText('Page 2 of 2 | 21 records')).toBeVisible();
  expect(reads.some((url) => url.searchParams.get('page') === '2')).toBe(true);
  await page.getByLabel('Payout status', { exact: true }).selectOption('ON_HOLD');
  await expect(page.getByText('Page 1 of 2 | 21 records')).toBeVisible();
  await page.getByRole('button', { name: 'Actions for PAY-TEST' }).click();
  await expect(page.getByRole('menuitem', { name: 'Mark processing' })).toHaveCount(0);
  await page.getByRole('menuitem', { name: 'Lift hold' }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(writes[0]).toEqual({ action: 'lift-hold', body: {} });
  await page.getByRole('button', { name: 'Actions for PAY-TEST' }).click();
  await page.getByRole('menuitem', { name: 'Mark processing' }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Actions for PAY-TEST' }).click();
  await page.getByRole('menuitem', { name: 'Record payment' }).click();
  await expect(page.getByRole('button', { name: 'Confirm', exact: true })).toBeDisabled();
  await page.getByLabel('Bank transaction reference (UTR)').fill('UTR-123');
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(writes.at(-1)).toEqual({ action: 'mark-paid', body: { utrNumber: 'UTR-123' } });
  await expect(page.getByRole('button', { name: 'Actions for PAY-TEST' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('payout errors remain visible and failed changes keep their confirmation open', async ({
  page,
}) => {
  const { writes } = await fixture(page, { failWrite: true });
  await page.goto('/financial/payouts');
  await page.getByRole('button', { name: 'Actions for PAY-TEST' }).click();
  await page.getByRole('menuitem', { name: 'Lift hold' }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('could not be updated');
  expect(writes).toHaveLength(1);
});

test('payout collection errors have a retry control', async ({ page }) => {
  await fixture(page, { failRead: true });
  await page.goto('/financial/payouts');
  await expect(page.getByRole('alert').filter({ hasText: 'Unable to load payouts' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Refresh payouts' })).toBeEnabled();
});

test('unverified payout destinations cannot be marked processing', async ({ page }) => {
  await fixture(page, { verified: false });
  await page.goto('/financial/payouts');
  await page.getByRole('button', { name: 'Actions for PAY-TEST' }).click();
  await page.getByRole('menuitem', { name: 'Lift hold' }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Actions for PAY-TEST' }).click();
  await expect(page.getByRole('menuitem', { name: 'Mark processing' })).toBeDisabled();
});
