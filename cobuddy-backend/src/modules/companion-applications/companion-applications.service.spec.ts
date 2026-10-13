import * as bcrypt from 'bcrypt';
import { CompanionApplicationsService } from './companion-applications.service';

jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('fixture-bcrypt-hash') }));

describe('Companion application approval', () => {
  it('stores only a bcrypt credential and returns public companion fields', async () => {
    const application = {
      id: 'application',
      firstName: 'Test',
      lastName: 'Companion',
      email: 'companion@example.test',
      phone: '9999999999',
      cityId: 'city',
      companionId: null,
    };
    const db: any = {
      companionApplication: {
        findUnique: jest.fn().mockResolvedValue(application),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({ ...application, applicationStatus: 'APPROVED' }),
      },
      companion: { create: jest.fn().mockResolvedValue({ id: 'companion' }) },
      wallet: { create: jest.fn().mockResolvedValue({ id: 'wallet' }) },
    };
    db.$transaction = (work: any) => work(db);

    const result = await new CompanionApplicationsService(db).approve('application', {
      sub: 'admin',
    } as any);

    expect(bcrypt.hash).toHaveBeenCalledWith(expect.any(String), 12);
    const create = db.companion.create.mock.calls[0][0];
    expect(create.data.passwordHash).toBe('fixture-bcrypt-hash');
    expect(create.select.passwordHash).toBeUndefined();
    expect(result.data.companion).not.toHaveProperty('passwordHash');
  });
});

describe('Companion application assignment', () => {
  const admin = {
    sub: 'reviewer',
    name: 'Reviewer',
    roles: ['MODERATOR'],
    cityScopeIds: ['city'],
  } as any;
  const make = (overrides = {}) => {
    const application = {
      id: 'application',
      applicationStatus: 'PENDING',
      cityId: 'city',
      companionId: null,
      reviewedByStaffId: null,
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      ...overrides,
    };
    const db: any = {
      companionApplication: {
        findUnique: jest.fn().mockImplementation(async () => application),
        updateMany: jest.fn().mockImplementation(async ({ data }) => {
          Object.assign(application, data);
          return { count: 1 };
        }),
      },
      city: { findMany: jest.fn().mockResolvedValue([{ id: 'city', name: { en: 'City name' } }]) },
      staffEmployee: {
        findMany: jest.fn().mockResolvedValue([{ id: 'reviewer', name: 'Reviewer' }]),
        findFirst: jest.fn().mockResolvedValue({ id: 'reviewer' }),
      },
    };
    return { db, service: new CompanionApplicationsService(db) };
  };
  it('claims legacy pending records with the authenticated identity and returns resolved labels', async () => {
    const { db, service } = make();
    const result = await service.assignSelf('application', admin);
    expect(result.data.applicationStatus).toBe('SCREENING');
    expect(result.data.reviewedBy).toEqual({ id: 'reviewer', name: 'Reviewer' });
    expect(result.data.city?.name).toEqual({ en: 'City name' });
    expect(db.companionApplication.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          reviewedByStaffId: null,
          companionId: null,
          applicationStatus: 'PENDING',
        }),
      }),
    );
    await service.assignSelf('application', admin);
    expect(db.companionApplication.updateMany).toHaveBeenCalledTimes(1);
  });
  it('rejects another reviewer, closed records and out-of-scope applications', async () => {
    for (const [override, message] of [
      [{ reviewedByStaffId: 'other' }, 'another reviewer'],
      [{ applicationStatus: 'APPROVED' }, 'already closed'],
      [{ cityId: 'other-city' }, 'not found'],
    ] as const) {
      const { db, service } = make(override);
      await expect(service.assignSelf('application', admin)).rejects.toThrow(message);
      expect(db.companionApplication.updateMany).not.toHaveBeenCalled();
    }
  });
  it('reports a race instead of overwriting the winning assignment', async () => {
    const { db, service } = make();
    db.companionApplication.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.assignSelf('application', admin)).rejects.toThrow('Application changed');
  });
  it('cannot bypass companion creation using a status-only approval', async () => {
    const { db, service } = make();
    await expect(
      service.updateStatus('application', { status: 'APPROVED' }, admin),
    ).rejects.toThrow('approval or rejection');
    expect(db.companionApplication.updateMany).not.toHaveBeenCalled();
  });

  const interview = () => ({
    scheduledAt: new Date(Date.now() + 86400000),
    interviewerStaffId: 'reviewer',
    meetingLink: 'https://meet.example.test/interview',
  });

  it('persists the appointment and returns it on a fresh detail read', async () => {
    const { service } = make();
    const payload = interview();
    await service.scheduleInterview('application', payload, admin);
    const result = await service.findOne('application', admin);
    expect(result.data.applicationStatus).toBe('INTERVIEW_SCHEDULED');
    expect(result.data.reviewedByStaffId).toBe(admin.sub);
    expect(result.data.interview).toEqual({
      ...payload,
      interviewer: { id: 'reviewer', name: 'Reviewer' },
    });
  });

  it('rejects a competing application update rather than overwriting it', async () => {
    const { db, service } = make();
    db.companionApplication.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.scheduleInterview('application', interview(), admin)).rejects.toThrow(
      'Application changed',
    );
    expect(db.companionApplication.updateMany.mock.calls[0][0].where).toMatchObject({
      companionId: null,
      reviewedByStaffId: null,
      applicationStatus: 'PENDING',
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    });
  });

  it('rejects past appointments, ineligible staff and a status-only scheduling bypass', async () => {
    const { db, service } = make();
    await expect(
      service.scheduleInterview('application', { ...interview(), scheduledAt: new Date(0) }, admin),
    ).rejects.toThrow('future');
    db.staffEmployee.findFirst.mockResolvedValue(null);
    await expect(service.scheduleInterview('application', interview(), admin)).rejects.toThrow(
      'active reviewer',
    );
    await expect(
      service.updateStatus('application', { status: 'INTERVIEW_SCHEDULED' }, admin),
    ).rejects.toThrow('schedule interview action');
    expect(db.companionApplication.updateMany).not.toHaveBeenCalled();
  });

  it('cancels the saved appointment when returning an application to the waitlist', async () => {
    const { service } = make();
    await service.scheduleInterview('application', interview(), admin);
    const result = await service.updateStatus('application', { status: 'WAITLISTED' }, admin);
    expect(result.data.interview).toBeNull();
    expect(result.data.interviewerStaffId).toBeNull();
    expect(result.data.reviewedByStaffId).toBeNull();
  });
});
