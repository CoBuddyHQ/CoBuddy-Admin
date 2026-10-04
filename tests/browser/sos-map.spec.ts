import { expect, test, type Page } from '@playwright/test';

function alertFixture(id: string, status: string, lat: number | null = 18.5204) {
  return {
    id,
    status,
    userId: id,
    userType: 'CUSTOMER',
    lat,
    lng: 73.8567,
    createdAt: '2026-01-01T12:00:00Z',
    booking: {
      bookingRef: 'BOOK-' + id,
      customer: { name: 'Customer ' + id, phone: '+919000000000' },
      companion: { name: 'Companion ' + id, phone: '+919000000001' },
    },
  };
}

async function setup(page: Page, roles = ['SAFETY_OPERATOR']) {
  const state = {
    alerts: [
      alertFixture('one', 'TRIGGERED'),
      alertFixture('two', 'ESCALATED_AUTHORITIES'),
      alertFixture('missing', 'INVESTIGATING', null),
      alertFixture('closed', 'RESOLVED_REAL_INCIDENT'),
    ],
    fail: false,
    failWrite: false,
    reads: 0,
    writes: [] as { status: string }[],
  };
  await page.addInitScript(() => localStorage.setItem('admin_token', 'sos-test-access'));
  // Keep browser tests independent of Google credentials and billable requests.
  await page.route('https://maps.googleapis.com/**', (route) => route.abort());
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^.*\/api/, '');
    const respond = (data: unknown, status = 200) =>
      route.fulfill({
        status,
        json: { data },
        headers: { 'access-control-allow-origin': '*' },
      });
    if (path === '/auth/me')
      return respond({
        id: 'safety-test',
        name: 'Safety Operator',
        email: 'safety@example.invalid',
        roles,
        cityScopeIds: [],
      });
    if (path === '/safety/sos') {
      state.reads++;
      expect(url.searchParams.get('activeOnly')).toBe('true');
      return respond(state.fail ? null : state.alerts, state.fail ? 503 : 200);
    }
    if (path.endsWith('/status')) {
      const body = route.request().postDataJSON();
      state.writes.push(body);
      if (state.failWrite) return respond(null, 503);
      const id = path.split('/')[3];
      state.alerts = state.alerts.map((alert) =>
        alert.id === id
          ? {
              ...alert,
              status: body.status === 'RESOLVED' ? 'RESOLVED_FALSE_ALARM' : body.status,
            }
          : alert,
      );
      return respond({});
    }
    return respond([]);
  });
  return state;
}

test('SOS map keeps escalations visible and links only valid reported coordinates', async ({
  page,
}, testInfo) => {
  await setup(page);
  await page.goto('/safety/sos-dashboard');
  await expect(page.getByRole('article')).toHaveCount(3);
  await expect(page.getByText('Escalated', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Locate Customer missing' })).toBeDisabled();
  await expect(page.getByText('Location unavailable for 1 alert(s).')).toBeVisible();
  await page.getByRole('button', { name: 'Locate Customer one', exact: true }).click();
  await expect(page.getByText('Reported location: 18.520400, 73.856700')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Directions', exact: true })).toHaveAttribute(
    'href',
    'https://www.google.com/maps/dir/?api=1&destination=18.5204%2C73.8567',
  );
  await expect(page.getByRole('link', { name: 'Google Maps', exact: true })).toHaveAttribute(
    'target',
    '_blank',
  );
  await expect(page.getByText(/Google Maps is (not configured|unavailable)\./)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath('sos-map.png'), fullPage: true });
});

test('SOS polling updates a selected location and preserves alerts during an outage', async ({
  page,
}) => {
  const state = await setup(page);
  await page.goto('/safety/sos-dashboard');
  await page.getByRole('button', { name: 'Locate Customer one', exact: true }).click();
  state.alerts[0].lat = 19.076;
  await expect(page.getByText('Reported location: 19.076000, 73.856700')).toBeVisible({
    timeout: 12000,
  });
  expect(state.reads).toBeGreaterThan(1);
  state.fail = true;
  await page.getByRole('button', { name: 'Refresh SOS alerts' }).click();
  await expect(
    page.getByText('SOS updates interrupted. Showing the last received alerts.'),
  ).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(3);
  await expect(page.getByText('No active SOS alerts.')).toHaveCount(0);
  state.fail = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(
    page.getByText('SOS updates interrupted. Showing the last received alerts.'),
  ).toHaveCount(0);
});

test('SOS resolves only after confirmation and retains the alert on failed writes', async ({
  page,
}) => {
  const state = await setup(page);
  await page.goto('/safety/sos-dashboard');
  const alert = page.getByRole('article', { name: 'SOS alert for Customer one', exact: true });
  await alert.getByRole('button', { name: 'Mark resolved' }).click();
  expect(state.writes).toHaveLength(0);
  state.failWrite = true;
  await page.getByRole('button', { name: 'Confirm resolution' }).click();
  await expect(page.getByText('Could not update the SOS alert. Please try again.')).toBeVisible();
  await expect(page.getByRole('dialog')).toBeVisible();
  state.failWrite = false;
  await page.getByRole('button', { name: 'Confirm resolution' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(alert).toHaveCount(0);
});

test('SOS initial errors do not show an all-clear state', async ({ page }) => {
  const state = await setup(page);
  state.fail = true;
  await page.goto('/safety/sos-dashboard');
  await expect(page.getByText('Could not load SOS alerts.')).toBeVisible();
  await expect(page.getByText('No active SOS alerts.')).toHaveCount(0);
  state.fail = false;
  state.alerts = [];
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByText('No active SOS alerts.')).toBeVisible();
});

test('staff without SOS permission cannot request or view emergency locations', async ({
  page,
}) => {
  const state = await setup(page, ['FINANCE_ADMIN']);
  await page.goto('/safety/sos-dashboard');
  await expect(page.getByText('You do not have access to SOS alerts.')).toBeVisible();
  expect(state.reads).toBe(0);
  await expect(page.getByRole('region', { name: 'Live SOS map' })).toHaveCount(0);
});
