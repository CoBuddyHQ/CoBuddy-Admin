import { expect, test, type Page } from '@playwright/test';

async function signInFixture(page: Page) {
  const requests: string[] = [];
  let released = false;
  let twoFactorEnabled = false;
  await page.addInitScript(() => {
    localStorage.setItem('admin_token', 'browser-test-access');
    localStorage.setItem('admin_refresh_token', 'browser-test-refresh');
  });
  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace(/^.*\/api/, '');
    requests.push(path);
    let data: unknown = [];
    let meta: unknown;
    if (path === '/auth/me')
      data = {
        id: 'browser-finance',
        name: 'Finance Test',
        email: 'finance@example.invalid',
        roles: ['FINANCE_ADMIN'],
        cityScopeIds: [],
        twoFactorEnabled,
      };
    if (path === '/financial/escrow') {
      data = released
        ? []
        : [
            {
              id: 'booking-test',
              bookingRef: 'BOOK-TEST',
              status: 'COMPLETED',
              customer: { id: 'customer-test', name: 'Test Customer' },
              companion: { id: 'companion-test', name: 'Test Companion' },
              companionNetAmount: '80.25',
              platformFeeAmount: '20.00',
              escrowReleaseAt: '2020-01-01T00:00:00Z',
            },
          ];
      meta = {
        page: 1,
        pageSize: 20,
        totalItems: released ? 0 : 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };
    }
    if (path === '/financial/wallets') {
      data = [
        {
          id: 'wallet-test',
          ownerType: 'COMPANION',
          currency: 'INR',
          balance: released ? '120.25' : '40.00',
          customer: null,
          companion: { id: 'companion-test', name: 'Test Companion' },
          updatedAt: '2026-01-01T12:00:00Z',
        },
      ];
      meta = {
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };
    }
    if (path === '/financial/escrow/booking-test/release') {
      expect(req.method()).toBe('POST');
      expect(req.postData()).toBeNull();
      released = true;
    }
    if (path === '/auth/2fa/setup')
      data = {
        qrcodeDataUrl:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
      };
    if (path === '/auth/2fa/confirm') {
      expect(req.postDataJSON()).toEqual({ otp: '123456' });
      twoFactorEnabled = true;
    }
    await route.fulfill({
      json: { success: true, data, meta },
      headers: { 'access-control-allow-origin': '*' },
    });
  });
  return requests;
}

test('protected pages redirect anonymous visitors to sign in', async ({ page }) => {
  await page.goto('/financial/escrow');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
});

test('staff can accept an invitation without exposing its token in the request URL', async ({
  page,
}) => {
  let body: unknown;
  await page.route('**/api/employees/staff-1/accept-invite', async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ json: { success: true, data: { id: 'staff-1' } } });
  });
  await page.goto('/accept-invite#id=staff-1&token=invite-token');
  await page.getByLabel('New password').fill('Fixture-password-42!');
  await page.getByLabel('Confirm password').fill('Fixture-password-42!');
  await page.getByRole('button', { name: 'Activate account' }).click();
  await expect(page.getByText('Account activated. You can now sign in.')).toBeVisible();
  expect(body).toEqual({ token: 'invite-token', password: 'Fixture-password-42!' });
  await expect(page).toHaveURL(/\/accept-invite$/);
});

test('expired MFA challenges show the server error and allow another login', async ({ page }) => {
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({
      status: 401,
      json: {
        error: {
          code: 'TWO_FACTOR_REQUIRED',
          message: '2FA required',
          details: { requires2fa: true, mfaToken: 'fixture-mfa-token' },
        },
      },
    }),
  );
  await page.route('**/api/auth/verify-2fa', (route) =>
    route.fulfill({ status: 401, json: { error: { message: 'Expired or invalid mfaToken' } } }),
  );
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('admin@example.test');
  await page.getByLabel('Password', { exact: true }).fill('Fixture-password-42!');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByLabel('Authentication Code').fill('123456');
  await page.getByRole('button', { name: 'Verify & Sign In' }).click();
  await expect(page.getByText('Expired or invalid mfaToken')).toBeVisible();
  await page.getByRole('button', { name: 'Use another account' }).click();
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
});

test('escrow uses booking allocations and refreshes wallet balances after release', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const requests = await signInFixture(page);
  const response = await page.goto('/financial/escrow');
  expect(response?.headers()['x-frame-options']).toBe('DENY');
  await expect(page.getByRole('heading', { name: 'Escrow & Wallets' })).toBeVisible();
  await expect(page.getByText('BOOK-TEST')).toBeVisible();
  await expect(page.getByText('80.25', { exact: false })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('escrow.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Release', exact: true }).click();
  await expect(page.getByText('No pending escrow.')).toBeVisible();
  await expect(page.getByText('120.25', { exact: false })).toBeVisible();
  expect(requests.every((path) => path === '/auth/me' || path.startsWith('/financial/'))).toBe(
    true,
  );
  expect(errors).toEqual([]);
});

test('production blocks demo modules even when opened directly', async ({ page }) => {
  await signInFixture(page);
  await page.goto('/support/tickets');
  await expect(page.getByRole('heading', { name: 'Module unavailable' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tickets', exact: true })).toHaveCount(0);
});

test('profile enrolls MFA and sends a password recovery request', async ({ page }) => {
  const requests = await signInFixture(page);
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'My Profile' })).toBeVisible();
  await page.getByRole('button', { name: 'Enable', exact: true }).click();
  await expect(page.getByAltText('Authenticator enrollment QR code')).toBeVisible();
  await page.getByLabel('Authenticator code').fill('123456');
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Disable', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Send password reset email' }).click();
  await expect.poll(() => requests.includes('/auth/forgot-password')).toBe(true);
  expect(
    requests.some((path) => path.startsWith('/audit-logs') || path.startsWith('/safety/')),
  ).toBe(false);
});
