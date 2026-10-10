import { SafetyApiService } from './safety-api.service';
import { OperationsApiService } from '../operations-api/operations-api.service';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SosAlertQueryDto } from './dto/sos-alert-query.dto';

describe('Safety status consistency', () => {
  const actor = { sub: 'admin', name: 'Admin', roles: ['SUPER_ADMIN'], cityScopeIds: [] } as any;
  function fixture() {
    const alerts = [
      { id: 'a', bookingId: 'b', status: 'TRIGGERED' },
      { id: 'a2', bookingId: 'b', status: 'ESCALATED_AUTHORITIES' },
    ];
    let booking = { id: 'b', sosTriggered: true };
    let event = {
      id: 'g',
      zoneId: 'z',
      userType: 'CUSTOMER',
      seen: false,
      status: 'INVESTIGATING',
    };
    const db: any = {
      sOSAlert: {
        findMany: jest.fn(async () => alerts),
        findFirst: jest.fn(async ({ where }) => ({ ...alerts.find((a) => a.id === where.id) })),
        update: jest.fn(async ({ where, data }) =>
          Object.assign(
            alerts.find((a) => a.id === where.id)!,
            data,
          ),
        ),
        count: jest.fn(
          async ({ where }) => alerts.filter((a) => where.status.in.includes(a.status)).length,
        ),
        updateMany: jest.fn(async ({ where, data }) => {
          alerts
            .filter((a) => where.status.in.includes(a.status))
            .forEach((a) => Object.assign(a, data));
          return { count: 2 };
        }),
      },
      booking: {
        findFirst: jest.fn(async () => booking),
        update: jest.fn(async ({ data }) => (booking = { ...booking, ...data })),
      },
      sessionAuditLog: { create: jest.fn() },
      geofenceAlertEvent: {
        update: jest.fn(async ({ data }) => (event = { ...event, ...data })),
        findMany: jest.fn(async () => [event]),
      },
      geofenceZone: { findUnique: jest.fn(async () => ({ zoneName: 'Fixture' })) },
    };
    db.$transaction = jest.fn((work) => work(db));
    return { db, service: new SafetyApiService(db), booking: () => booking };
  }

  it('filters open alerts before the result limit without losing city restrictions', async () => {
    const { service, db } = fixture();
    await service.getSosAlerts(
      { ...actor, roles: ['SAFETY_OPERATOR'], cityScopeIds: ['city-a'] },
      true,
    );
    expect(db.sOSAlert.findMany.mock.calls[0][0]).toMatchObject({
      where: {
        booking: { cityId: { in: ['city-a'] } },
        status: { in: ['TRIGGERED', 'ACKNOWLEDGED', 'INVESTIGATING', 'ESCALATED_AUTHORITIES'] },
      },
      take: 500,
    });
    await service.getSosAlerts(actor);
    expect(db.sOSAlert.findMany.mock.calls[1][0].where).toEqual({});
  });

  it.each(['true', 'false', undefined])('accepts SOS activeOnly=%s', async (activeOnly) => {
    const query = plainToInstance(
      SosAlertQueryDto,
      { activeOnly },
      { enableImplicitConversion: true },
    );
    expect(await validate(query)).toHaveLength(0);
  });

  it.each(['yes', '1', ['true', 'false']])(
    'rejects ambiguous SOS filters: %s',
    async (activeOnly) => {
      const query = plainToInstance(
        SosAlertQueryDto,
        { activeOnly },
        { enableImplicitConversion: true },
      );
      expect((await validate(query)).length).toBeGreaterThan(0);
    },
  );

  it('keeps the booking flagged until every active alert is resolved', async () => {
    const { service, db, booking } = fixture();
    await service.updateSosStatus('a', 'RESOLVED', undefined, actor);
    expect(booking().sosTriggered).toBe(true);
    await service.updateSosStatus('a2', 'RESOLVED', undefined, actor);
    expect(booking().sosTriggered).toBe(false);
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
  });

  it('restores the booking flag and clears stale resolution metadata on reopening', async () => {
    const { service, db, booking } = fixture();
    await service.updateSosStatus('a', 'RESOLVED', undefined, actor);
    await service.updateSosStatus('a2', 'RESOLVED', undefined, actor);
    await service.updateSosStatus('a', 'ACTIVE', undefined, actor);
    expect(booking().sosTriggered).toBe(true);
    expect(db.sOSAlert.update.mock.calls[2][0].data).toMatchObject({
      resolvedAt: null,
      resolvedById: null,
      resolvedNote: null,
    });
  });

  it('uses the same consistency logic for emergency workflows', async () => {
    const { service, booking, db } = fixture();
    await service.advanceEmergencyWorkflow('a', 'RESOLVED', 'Resolved', actor);
    expect(booking().sosTriggered).toBe(true);
    expect(db.sessionAuditLog.create).toHaveBeenCalledTimes(1);
  });

  it('resolves escalated alerts as part of a live-session resolution', async () => {
    const { db, booking } = fixture();
    await new OperationsApiService(db).resolveLiveSessionSos('b', actor);
    expect(db.sOSAlert.updateMany.mock.calls[0][0].where.status.in).toContain(
      'ESCALATED_AUTHORITIES',
    );
    expect(booking().sosTriggered).toBe(false);
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
  });

  it.each(['ESCALATED', 'RESOLVED', 'INVESTIGATING'])(
    'persists geofence status %s across reads',
    async (status) => {
      const { service } = fixture();
      await service.updateGeofenceStatus('g', status, actor);
      expect((await service.getGeofenceAlerts(actor)).data[0].status).toBe(status);
    },
  );
});
