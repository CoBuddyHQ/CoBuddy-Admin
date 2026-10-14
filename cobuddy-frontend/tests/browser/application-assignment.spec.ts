import { test, expect } from '@playwright/test';

test('application pages and status filters fetch matching records from the API', async ({
  page,
}) => {
  const queries: URLSearchParams[] = [];
  await page.addInitScript(() => {
    localStorage.setItem('admin_token', 'fixture-token');
  });
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const endpoint = url.pathname.replace(/^.*\/api/, '');
    if (endpoint === '/auth/me')
      return route.fulfill({
        json: {
          success: true,
          data: { id: 'reviewer', name: 'Reviewer', roles: ['MODERATOR'], cityScopeIds: [] },
        },
      });
    if (endpoint === '/companion-applications') {
      expect(route.request().headers().authorization).toBe('Bearer fixture-token');
      queries.push(url.searchParams);
      const current = Number(url.searchParams.get('page'));
      const screening = url.searchParams.get('status') === 'SCREENING';
      return route.fulfill({
        json: {
          success: true,
          data: [
            {
              id: 'page-' + current,
              firstName: screening ? 'Screening' : 'Pending',
              lastName: `Page ${current}`,
              phone: 'fixture',
              cityId: 'CITY-1',
              applicationStatus: screening ? 'SCREENING' : 'SUBMITTED',
              createdAt: '2026-10-10T00:00:00Z',
              portfolioUrls: [],
            },
          ],
          meta: {
            page: current,
            pageSize: 20,
            totalItems: 21,
            totalPages: 2,
            hasNext: current < 2,
            hasPrevious: current > 1,
          },
        },
      });
    }
    return route.fulfill({ json: { success: true, data: [] } });
  });
  await page.goto('/companion-applications');
  await expect(page.getByText('Pending Page 1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.getByText('Pending Page 2', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'IN REVIEW', exact: true }).click();
  await expect(page.getByText('Screening Page 1', { exact: true })).toBeVisible();
  expect(queries.map((q) => [q.get('status'), q.get('page')])).toContainEqual(['SUBMITTED', '2']);
  expect(queries.at(-1)?.get('page')).toBe('1');
  expect(queries.at(-1)?.get('status')).toBe('SCREENING');
});

test('interviews keep failed drafts, save through the authenticated API and survive reload', async ({
  page,
}) => {
  let choiceAttempts = 0;
  let saveAttempts = 0;
  let interview: {
    scheduledAt: string;
    interviewerStaffId: string;
    meetingLink: string | null;
    interviewer: { id: string; name: string };
  } | null = null;
  await page.addInitScript(() => {
    localStorage.setItem('admin_token', 'fixture-token');
    localStorage.setItem('admin_refresh_token', 'fixture-refresh');
  });
  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace(/^.*\/api/, '');
    let data: unknown = [];
    const staff = { id: 'reviewer', name: 'Interview Reviewer' };
    if (path === '/auth/me')
      data = {
        ...staff,
        email: 'reviewer@example.invalid',
        roles: ['MODERATOR'],
        cityScopeIds: [],
      };
    if (path === '/companion-applications/APP-2/interviewers') {
      expect(req.headers().authorization).toBe('Bearer fixture-token');
      if (++choiceAttempts === 1) {
        await route.fulfill({
          status: 503,
          json: { success: false, error: { message: 'Reviewers unavailable' } },
        });
        return;
      }
      data = [staff];
    }
    if (path === '/companion-applications/APP-2/schedule-interview') {
      expect(req.method()).toBe('POST');
      expect(req.headers().authorization).toBe('Bearer fixture-token');
      expect(req.postDataJSON().interviewerStaffId).toBe(staff.id);
      expect(Date.parse(req.postDataJSON().scheduledAt)).toBeGreaterThan(Date.now());
      if (++saveAttempts === 1) {
        await route.fulfill({
          status: 409,
          json: {
            success: false,
            error: { message: 'Application changed. Reload and try again.' },
          },
        });
        return;
      }
      interview = {
        ...req.postDataJSON(),
        meetingLink: req.postDataJSON().meetingLink ?? null,
        interviewer: staff,
      };
    }
    const application = {
      id: 'APP-2',
      firstName: 'Interview',
      lastName: 'Applicant',
      phone: 'fixture-phone',
      cityId: 'CITY-1',
      applicationStatus: interview ? 'INTERVIEW_SCHEDULED' : 'SCREENING',
      createdAt: '2026-10-10T00:00:00Z',
      reviewedByStaffId: staff.id,
      reviewedBy: staff,
      portfolioUrls: [],
      interview,
    };
    if (path === '/companion-applications/APP-2') data = application;
    if (path === '/companion-applications/APP-2/schedule-interview')
      data = { application, interview };
    await route.fulfill({ json: { success: true, data } });
  });

  await page.goto('/companion-applications/APP-2');
  await page.getByRole('button', { name: 'Schedule Interview', exact: true }).click();
  await expect(page.getByText('Could not load reviewers.')).toBeVisible();
  await page.getByRole('button', { name: 'Retry reviewers' }).click();
  const appointmentTime = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 16);
  await page.getByLabel('Interview time (your local time)').fill(appointmentTime);
  await page.getByLabel('Interviewer', { exact: true }).selectOption('reviewer');
  await page.getByLabel('Meeting link (optional)').fill('https://meet.example.test/interview');
  await page.getByRole('button', { name: 'Save Interview', exact: true }).click();
  await expect(
    page.getByText('Interview could not be saved. Your changes are kept; try again.'),
  ).toBeVisible();
  await expect(page.getByLabel('Interview time (your local time)')).toHaveValue(appointmentTime);
  await expect(page.getByLabel('Meeting link (optional)')).toHaveValue(
    'https://meet.example.test/interview',
  );
  await page.getByRole('button', { name: 'Save Interview', exact: true }).click();
  await expect(page.getByText('INTERVIEW SCHEDULED', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: 'Open meeting link' })).toHaveAttribute(
    'href',
    'https://meet.example.test/interview',
  );
  await page.getByRole('button', { name: 'Reschedule Interview' }).click();
  await expect(page.getByLabel('Interview time (your local time)')).toHaveValue(appointmentTime);
  await page.getByLabel('Meeting link (optional)').fill('');
  await page.getByRole('button', { name: 'Save Interview', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open meeting link' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Reschedule Interview' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open meeting link' })).toHaveCount(0);
});

test('application assignment handles errors, persists reviewer, and submits waitlist notes', async ({
  page,
}) => {
  let assignmentAttempts = 0;
  let status = 'SUBMITTED';
  let reviewer: string | null = null;
  let notes: string | null = null;
  const requests: string[] = [];
  await page.addInitScript(() => {
    localStorage.setItem('admin_token', 'fixture-token');
    localStorage.setItem('admin_refresh_token', 'fixture-refresh');
  });
  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace(/^.*\/api/, '');
    requests.push(path);
    let data: unknown = [];
    if (path === '/auth/me')
      data = {
        id: 'reviewer',
        name: 'Review Staff',
        email: 'reviewer@example.invalid',
        roles: ['MODERATOR'],
        cityScopeIds: [],
      };
    if (path === '/companion-applications/APP-1/assign-self') {
      expect(req.method()).toBe('POST');
      expect(req.postData()).toBeNull();
      assignmentAttempts++;
      if (assignmentAttempts === 1) {
        await route.fulfill({
          status: 409,
          json: {
            success: false,
            error: { message: 'Application changed. Reload and try again.' },
          },
        });
        return;
      }
      reviewer = 'reviewer';
      status = 'SCREENING';
    }
    if (path === '/companion-applications/APP-1/status') {
      expect(req.method()).toBe('PATCH');
      expect(req.postDataJSON()).toEqual({
        status: 'WAITLISTED',
        reviewNotes: 'Follow up next week',
      });
      status = 'WAITLISTED';
      reviewer = null;
      notes = 'Follow up next week';
    }
    const application = {
      id: 'APP-1',
      firstName: 'Test',
      lastName: 'Applicant',
      phone: 'fixture-phone',
      email: 'applicant@example.invalid',
      cityId: 'CITY-1',
      city: { id: 'CITY-1', name: { en: 'Pune' } },
      applicationStatus: status,
      reviewedByStaffId: reviewer,
      reviewedBy: reviewer ? { id: reviewer, name: 'Review Staff' } : null,
      reviewNotes: notes,
      createdAt: '2026-10-10T00:00:00Z',
      portfolioUrls: [],
    };
    if (path.startsWith('/companion-applications/')) data = application;
    if (path === '/companion-applications') data = [application];
    await route.fulfill({ json: { success: true, data } });
  });
  await page.goto('/companion-applications/APP-1');
  await expect(page.getByText('Pune', { exact: true })).toBeVisible();
  await expect(page.getByText('Invalid Date')).toHaveCount(0);
  await expect(page.getByText('Not provided', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Assign To Me', exact: true }).click();
  await expect(
    page.getByText('Application changed. Reload and try again.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Assign To Me', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Assign To Me', exact: true }).click();
  await expect(page.getByText('IN REVIEW', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Assign To Me', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Approve Companion', exact: true })).toBeVisible();
  await page
    .getByPlaceholder('Interview notes / Decision rationale...')
    .fill('Follow up next week');
  await page.getByRole('button', { name: 'Add to Waitlist', exact: true }).click();
  await expect(page.getByText('WAITLISTED', { exact: true })).toBeVisible();
  await expect(page.getByText('Follow up next week', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Assign To Me', exact: true })).toBeEnabled();
  expect(requests.some((path) => path.includes('/master-data'))).toBe(false);
});
