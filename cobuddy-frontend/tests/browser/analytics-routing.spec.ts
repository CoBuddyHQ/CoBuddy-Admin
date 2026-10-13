import { expect, test, type Page } from '@playwright/test';

async function configureApi(page: Page, roles: string[], sessionFails = false) {
  await page.addInitScript(() => {
    localStorage.setItem('admin_token', 'analytics-routing-access');
  });
  const requested: string[] = [];
  await page.route(
    (url) =>
      ['localhost', '127.0.0.1', 'api.example.invalid'].includes(url.hostname) &&
      url.pathname.startsWith('/api/'),
    async (route) => {
      const path = new URL(route.request().url()).pathname;
      requested.push(path);
      if (path === '/api/auth/me') {
        return route.fulfill({
          status: sessionFails ? 503 : 200,
          json: {
            success: !sessionFails,
            data: {
              id: 'analytics-routing-fixture',
              name: 'Analytics routing fixture',
              email: 'analytics-routing@example.invalid',
              roles,
              cityScopeIds: [],
              twoFactorEnabled: false,
            },
          },
        });
      }
      if (path === '/api/analytics/sessions') {
        return route.fulfill({
          json: {
            success: true,
            data: {
              totalSessionsToday: 0,
              avgDurationMinutes: null,
              cancellationRate: null,
              chartData: [],
              statuses: [],
            },
          },
        });
      }
      if (path === '/api/analytics/safety') {
        return route.fulfill({
          json: {
            success: true,
            data: {
              activeRestrictions: 8,
              repeatOffenders: 2,
              repeatOffenderRate: 25,
              fraudHits: 4,
              spoofHits: 1,
              totalAgeEscalations: 3,
              resolvedAgeEscalations: 2,
              ageResolutionRate: 66.7,
              measuredAt: '2026-10-11T00:00:00.000Z',
            },
          },
        });
      }
      return route.fulfill({ json: { success: true, data: [] } });
    },
  );
  return requested;
}

for (const role of ['FINANCE_ADMIN', 'SUPER_ADMIN', 'CITY_OPS_MANAGER', 'SUPPORT_AGENT']) {
  test(`analytics index opens a permitted report for ${role}`, async ({ page }) => {
    const financial = ['FINANCE_ADMIN', 'SUPER_ADMIN'].includes(role);
    const destination = financial ? 'financial' : 'operational';
    const requested = await configureApi(page, [role]);
    const response = await page.goto('/analytics');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(new RegExp(`/analytics/${destination}$`));
    await expect(
      page.getByRole('heading', {
        name: financial ? 'Financial Analytics' : 'Session Metrics',
        exact: true,
      }),
    ).toBeVisible();
    expect(requested).toContain(`/api/analytics/${financial ? 'market' : 'sessions'}`);
    expect(requested).not.toContain(`/api/analytics/${financial ? 'sessions' : 'market'}`);
  });
}

test('analytics index keeps reports hidden from roles without analytics access', async ({
  page,
}) => {
  const requested = await configureApi(page, ['HR_ADMIN']);
  const response = await page.goto('/analytics');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('main').getByRole('alert')).toHaveText(
    'No analytics reports are available for your account.',
  );
  await expect(page).toHaveURL(/\/analytics$/);
  expect(requested.some((path) => path.startsWith('/api/analytics/'))).toBe(false);
});

test('safety operator opens safety analytics and reads the database aggregate API', async ({
  page,
}) => {
  const requested = await configureApi(page, ['SAFETY_OPERATOR']);
  const response = await page.goto('/analytics');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/analytics\/safety$/);
  await expect(page.getByRole('heading', { name: 'Safety Analytics' })).toBeVisible();
  await expect(page.getByText('8', { exact: true })).toBeVisible();
  expect(requested).toContain('/api/analytics/safety');
});

test('analytics index requires login for anonymous visitors', async ({ page }) => {
  const response = await page.goto('/analytics');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
});

test('analytics index waits for a verified session before requesting reports', async ({ page }) => {
  const requested = await configureApi(page, ['SUPER_ADMIN'], true);
  await page.goto('/analytics');
  await expect(
    page.getByRole('alert').filter({ hasText: 'Unable to verify your session.' }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/analytics$/);
  expect(requested.some((path) => path.startsWith('/api/analytics/'))).toBe(false);
});
