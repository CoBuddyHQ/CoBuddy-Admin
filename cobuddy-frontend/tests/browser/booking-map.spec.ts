import { test, expect } from '@playwright/test';

test('booking venues use reported coordinates and retain unlocated sessions', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('admin_token', 'booking-map-fixture'));
  await page.route('https://maps.googleapis.com/**', (route) => route.abort());
  let fail = false;
  await page.route(
    (url) =>
      url.pathname.startsWith('/api/') &&
      ['localhost', '127.0.0.1', 'api.example.invalid'].includes(url.hostname),
    async (route) => {
      const path = new URL(route.request().url()).pathname;
      let data: unknown = [];
      if (path === '/api/auth/me')
        data = {
          id: 'ops-test',
          name: 'Operations',
          email: 'ops@example.invalid',
          roles: ['CITY_OPS_MANAGER'],
          cityScopeIds: ['city-a'],
        };
      if (path === '/api/operations/live-map/active-bookings') {
        if (fail) return route.fulfill({ status: 503, json: { error: { message: 'Offline' } } });
        data = [
          {
            id: 'one',
            bookingRef: 'BOOK-ONE',
            customer: { name: 'Customer' },
            companion: { name: 'Companion' },
            venue: { lat: 18.5204, lng: 73.8567 },
            status: 'IN_PROGRESS',
          },
          { id: 'missing', bookingRef: 'BOOK-MISSING', status: 'ARRIVING' },
        ];
      }
      return route.fulfill({ json: { data }, headers: { 'access-control-allow-origin': '*' } });
    },
  );
  await page.goto('/operations/live-map');
  await expect(page.getByText('Active Sessions (2)')).toBeVisible();
  await expect(page.getByText('Venue location unavailable for 1 booking(s).')).toBeVisible();
  await page.getByRole('button', { name: /BOOK-ONE/ }).click();
  await expect(page.getByText('Venue coordinates: 18.520400, 73.856700')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Directions to venue' })).toHaveAttribute(
    'href',
    'https://www.google.com/maps/dir/?api=1&destination=18.5204%2C73.8567',
  );
  await expect(page.getByText(/Google Maps is (unavailable|not configured)\./)).toBeVisible();
  await page.getByRole('button', { name: /BOOK-MISSING/ }).click();
  await expect(page.getByRole('link', { name: 'Directions to venue' })).toHaveCount(0);
  fail = true;
  await page.getByRole('button', { name: 'Refresh bookings' }).click();
  await expect(
    page.getByText('Updates interrupted. Showing the last received bookings.'),
  ).toBeVisible();
  await expect(page.getByText('Active Sessions (2)')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('booking-map.png'), fullPage: true });
});
