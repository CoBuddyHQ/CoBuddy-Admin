import { expect, test, type Page } from '@playwright/test';

const cityId = 'e4b95963-41b6-445d-908d-f48f0e6ba47b';
const options = {
  appLanguages: [{ id: 'en', code: 'en', name: 'English', active: true }],
  placeTypes: [{ id: 'cafe', code: 'cafe', displayName: { en: 'Cafe' }, isAllowed: true }],
  ticketCategories: [],
  notificationCategories: [{ code: 'GENERAL', label: { en: 'General' }, active: true }],
};
const weights = {
  trustScoreWeight: 35,
  ratingWeight: 25,
  responseTimeWeight: 15,
  acceptRateWeight: 10,
  sessionCompletionWeight: 10,
  proximityBonusWeight: 5,
  newCompanionBoostPercent: 20,
};

async function configure(page: Page, overrides: Record<string, unknown> = {}) {
  await page.addInitScript(() => localStorage.setItem('admin_token', 'workflow-browser-fixture'));
  const requested: string[] = [];
  await page.route(
    (url) =>
      ['localhost', '127.0.0.1', 'api.example.invalid'].includes(url.hostname) &&
      url.pathname.startsWith('/api/'),
    async (route) => {
      const path = new URL(route.request().url()).pathname.replace('/api', '');
      requested.push(path);
      const data: Record<string, unknown> = {
        '/auth/me': {
          id: 'workflow-staff',
          name: 'Workflow staff',
          email: 'workflow@example.invalid',
          roles: ['SUPER_ADMIN'],
          cityScopeIds: [],
        },
        '/admin-options/workflow': options,
        '/admin-options/cities': [{ id: cityId, name: { en: 'Test City' }, state: 'Region' }],
        '/discovery/ranking-config': weights,
        '/discovery/ranking-config/settings': {
          enableDarkThemeDefault: false,
          homeScreenLayout: 'GRID',
          featuredSectionTitle: 'Featured',
          maxFeaturedCompanions: 10,
        },
        '/operations/city-launch/waitlist/config': {
          requireInviteCode: true,
          autoApproveWaitlist: false,
          maxDailyInvites: 100,
        },
        '/platform-config/policy-docs/settings': {
          contactEmail: '',
          supportPhone: '',
          termsUrl: '',
          privacyUrl: '',
        },
        '/platform-config/training/quiz': {
          totalQuestions: 0,
          passCriteriaPercentage: null,
          activeCompanionsPassed: 0,
        },
        '/marketing/notifications/config': {
          deliveryConfigured: false,
          schedulingEnabled: false,
          provider: 'Gateway',
        },
        ...overrides,
      };
      await route.fulfill({ json: { success: true, data: data[path] ?? [] } });
    },
  );
  return requested;
}

const screens = [
  ['/discovery/events', 'Special Events & Category Highlights', '/discovery/events'],
  ['/discovery/ranking-config', 'Discovery & Ranking Config', '/discovery/ranking-config'],
  ['/operations/city-launch', 'City Launch', '/operations/city-launch'],
  ['/operations/growth-abuse', 'Growth', '/operations/growth-abuse'],
  ['/operations/venues', 'Venue Management', '/operations/venues'],
  ['/platform-config/policy-docs', 'Policy & Legal Documents', '/platform-config/policy-docs'],
  ['/platform-config/training', 'Training & Content Management', '/platform-config/training'],
  ['/marketing/notifications', 'Push Notifications & Triggers', '/marketing/notifications'],
  ['/legal/data-privacy', 'Data Privacy & Deletion Requests', '/legal/data-privacy'],
  ['/legal/legal-requests', 'Law-Enforcement Request Tracker', '/legal/legal-requests'],
  ['/support/sla-dashboard', 'SLA Tracking Dashboard', '/support/sla-dashboard/alerts'],
  ['/support/tickets', 'Support Tickets', '/support/tickets'],
];
for (const [path, heading, endpoint] of screens) {
  test(`workflow ${path} loads its real adapter and renders an empty database`, async ({
    page,
  }) => {
    const requested = await configure(page);
    await page.goto(path);
    await expect(
      page.getByRole('heading', { name: new RegExp(heading.replace(/[&]/g, '&')) }).first(),
    ).toBeVisible();
    expect(requested).toContain(endpoint);
    expect(requested).not.toContain('/employees');
    await expect(page.getByText('Module unavailable')).toHaveCount(0);
  });
}

test('events keep the draft after rejected writes and save the selected city ID', async ({
  page,
}) => {
  await configure(page);
  let reject = true;
  let saved: Record<string, unknown> | undefined;
  await page.route('**/api/discovery/events', async (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({
        json: { data: saved ? [{ ...saved, id: 'event-fixture', isActive: true }] : [] },
      });
    if (reject)
      return route.fulfill({
        status: 400,
        json: { error: { message: 'Date range was rejected' } },
      });
    saved = route.request().postDataJSON();
    return route.fulfill({ status: 201, json: { data: saved } });
  });
  await page.goto('/discovery/events');
  await page.getByRole('button', { name: 'Create Event', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('City', { exact: true }).selectOption(cityId);
  await dialog.getByPlaceholder("e.g. Valentine's Week").fill('Database event');
  await dialog.getByPlaceholder('Short description for the banner...').fill('Real saved content');
  await dialog.locator('input[type=date]').nth(0).fill('2027-01-01');
  await dialog.locator('input[type=date]').nth(1).fill('2027-01-02');
  await dialog.getByRole('button', { name: 'Create Event', exact: true }).click();
  await expect(page.getByText('Date range was rejected')).toBeVisible();
  await expect(dialog.getByPlaceholder("e.g. Valentine's Week")).toHaveValue('Database event');
  reject = false;
  await dialog.getByRole('button', { name: 'Create Event', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('Database event', { exact: true })).toBeVisible();
  expect(saved?.cityId).toBe(cityId);
});

test('workflow read errors show retry instead of an empty successful list', async ({ page }) => {
  await configure(page);
  let fail = true;
  await page.route('**/api/discovery/events', (route) =>
    route.fulfill(
      fail
        ? { status: 503, json: { error: { message: 'Temporary outage' } } }
        : { json: { data: [] } },
    ),
  );
  await page.goto('/discovery/events');
  await expect(page.getByRole('heading', { name: 'Unable to load this module' })).toBeVisible({
    timeout: 15000,
  });
  fail = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Special Events & Category Highlights' }),
  ).toBeVisible();
});

test('notifications cannot send through an unconfigured provider', async ({ page }) => {
  await configure(page, {
    '/marketing/notifications': [
      {
        id: 'draft',
        title: 'Saved draft',
        message: 'Message',
        category: 'GENERAL',
        status: 'DRAFT',
        targetAudience: 'ALL',
      },
    ],
  });
  await page.goto('/marketing/notifications');
  await expect(page.getByText('Saved draft')).toBeVisible();
  await expect(page.getByRole('button', { name: /Send Now/i })).toBeDisabled();
});

test('SLA does not invent a resolution time for unmeasured historical tickets', async ({
  page,
}) => {
  await configure(page, {
    '/support/sla-dashboard/performance': [
      {
        agentId: 'staff',
        agentName: 'Agent',
        ticketsResolved: 2,
        averageResolutionTimeMs: null,
        slaBreaches: 0,
        activeTickets: 0,
      },
    ],
  });
  await page.goto('/support/sla-dashboard');
  await expect(page.getByText('Not measured')).toBeVisible();
});
