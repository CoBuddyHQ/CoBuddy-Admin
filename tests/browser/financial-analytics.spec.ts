import { expect, test, type Page } from '@playwright/test';

const profile = {
  id: 'finance-analytics-fixture',
  name: 'Finance fixture',
  email: 'finance@example.invalid',
  roles: ['FINANCE_ADMIN'],
  cityScopeIds: [],
  twoFactorEnabled: false,
};
const cities = [
  {
    cityId: 'city-fixture',
    cityName: 'Analytics Test City',
    totalBookings: 14,
    activeCompanions: 3,
    revenueGenerated: 2500,
    growthRate: null,
  },
];

async function configureApi(page: Page, options = { authenticated: true, failing: false }) {
  if (options.authenticated) {
    await page.addInitScript(() => {
      localStorage.setItem('admin_token', 'analytics-test-access');
      localStorage.setItem('admin_refresh_token', 'analytics-test-refresh');
    });
  }
  const requested: string[] = [];
  await page.route(
    (url) =>
      ['localhost', '127.0.0.1', 'api.example.invalid'].includes(url.hostname) &&
      url.pathname.startsWith('/api/'),
    async (route) => {
      const path = new URL(route.request().url()).pathname;
      requested.push(path);
      if (path === '/api/auth/login') {
        expect(route.request().postDataJSON()).toEqual({
          email: profile.email,
          password: 'Browser-test-password-only',
        });
        return route.fulfill({
          status: 201,
          json: {
            success: true,
            data: {
              accessToken: 'analytics-test-access',
              refreshToken: 'analytics-test-refresh',
              profile,
            },
          },
        });
      }
      if (path === '/api/auth/me') {
        return route.fulfill({ json: { success: true, data: profile } });
      }
      if (path === '/api/analytics/market') {
        expect(route.request().headers().authorization).toBe('Bearer analytics-test-access');
        return options.failing
          ? route.fulfill({ status: 503, json: { success: false } })
          : route.fulfill({ json: { success: true, data: cities } });
      }
      return route.fulfill({ json: { success: true, data: [] } });
    },
  );
  return requested;
}

test('financial analytics renders non-empty API data and currency ticks without crashing', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await configureApi(page);
  await page.goto('/analytics/financial');
  await expect(
    page.getByRole('heading', { name: 'Financial Analytics', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('cell', { name: cities[0].cityName, exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: '2,500', exact: false })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'No prior bookings', exact: true })).toBeVisible();
  await expect(page.locator('.recharts-yAxis .recharts-cartesian-axis-tick').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Unable to load this page' })).toHaveCount(0);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: test.info().outputPath('financial-analytics.png'),
    fullPage: true,
  });
});

test('financial API failures remain distinct from an empty dataset and can be retried', async ({
  page,
}) => {
  const options = { authenticated: true, failing: true };
  await configureApi(page, options);
  await page.goto('/analytics/financial');
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Could not load city metrics.',
  );
  await expect(page.getByText('No cities configured.')).toHaveCount(0);
  options.failing = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('cell', { name: cities[0].cityName, exact: true })).toBeVisible();
});

test('login waits for JavaScript before accepting credentials or form submissions', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/login`);
    await expect(page.getByLabel('Email', { exact: true })).toBeDisabled();
    await expect(page.getByLabel('Password', { exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeDisabled();
  } finally {
    await context.close();
  }
});

test('a successful login keeps its session when navigating to financial analytics', async ({
  page,
}) => {
  const requested = await configureApi(page, { authenticated: false, failing: false });
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(profile.email);
  await page.getByLabel('Password', { exact: true }).fill('Browser-test-password-only');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login$/);
  await page.goto('/analytics/financial');
  await expect(page.getByRole('cell', { name: cities[0].cityName, exact: true })).toBeVisible();
  expect(requested).toContain('/api/auth/login');
  expect(requested).toContain('/api/auth/me');
  expect(requested).toContain('/api/analytics/market');
});
