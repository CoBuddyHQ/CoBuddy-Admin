import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GeofenceAlertStatus, IncidentStatus, Prisma, SOSStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.module';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { scopedCities } from '@/common/auth/city-scope';

const activeSosStatuses: SOSStatus[] = [
  SOSStatus.TRIGGERED,
  SOSStatus.ACKNOWLEDGED,
  SOSStatus.INVESTIGATING,
  SOSStatus.ESCALATED_AUTHORITIES,
];

@Injectable()
export class SafetyApiService {
  constructor(private readonly prisma: PrismaService) {}

  private cityScope(user: AuthStaffPayload) {
    return scopedCities(user);
  }

  async getSosAlerts(user: AuthStaffPayload, activeOnly = false) {
    const cityIds = this.cityScope(user);
    const data = await this.prisma.sOSAlert.findMany({
      where: {
        ...(cityIds ? { booking: { cityId: { in: cityIds } } } : {}),
        ...(activeOnly ? { status: { in: activeSosStatuses } } : {}),
      },
      include: {
        booking: {
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            companion: { select: { id: true, name: true, phone: true } },
            venue: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 500,
    });
    return { data, message: 'SOS alerts fetched' };
  }

  async updateSosStatus(
    id: string,
    status: string,
    note: string | undefined,
    user: AuthStaffPayload,
  ) {
    const statusMap: Record<string, SOSStatus> = {
      ACTIVE: SOSStatus.TRIGGERED,
      TRIGGERED: SOSStatus.TRIGGERED,
      ACKNOWLEDGED: SOSStatus.ACKNOWLEDGED,
      INVESTIGATING: SOSStatus.INVESTIGATING,
      RESOLVED: SOSStatus.RESOLVED_FALSE_ALARM,
      RESOLVED_FALSE_ALARM: SOSStatus.RESOLVED_FALSE_ALARM,
      RESOLVED_REAL_INCIDENT: SOSStatus.RESOLVED_REAL_INCIDENT,
      ESCALATED_AUTHORITIES: SOSStatus.ESCALATED_AUTHORITIES,
    };
    const mapped = statusMap[status];
    if (!mapped) throw new BadRequestException('Invalid SOS status');
    const data = await this.prisma.$transaction(
      (tx) => this.writeSosStatus(tx, id, mapped, note, user),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return { data, message: 'SOS alert updated' };
  }

  private async writeSosStatus(
    tx: Prisma.TransactionClient,
    id: string,
    mapped: SOSStatus,
    note: string | undefined,
    user: AuthStaffPayload,
  ) {
    const cityIds = this.cityScope(user);
    const existing = await tx.sOSAlert.findFirst({
      where: {
        id,
        ...(cityIds ? { booking: { cityId: { in: cityIds } } } : {}),
      },
    });
    if (!existing) throw new NotFoundException('SOS alert not found');
    const data = await tx.sOSAlert.update({
      where: { id },
      data: {
        status: mapped,
        ...(mapped === SOSStatus.ACKNOWLEDGED && !existing.acknowledgedAt
          ? { acknowledgedById: user.sub, acknowledgedAt: new Date() }
          : {}),
        ...(mapped === SOSStatus.RESOLVED_FALSE_ALARM || mapped === SOSStatus.RESOLVED_REAL_INCIDENT
          ? { resolvedById: user.sub, resolvedAt: new Date(), resolvedNote: note ?? null }
          : { resolvedById: null, resolvedAt: null, resolvedNote: null }),
        ...(mapped === SOSStatus.ESCALATED_AUTHORITIES ? { authoritiesContacted: true } : {}),
      },
    });
    if (existing.bookingId) {
      const active = await tx.sOSAlert.count({
        where: { bookingId: existing.bookingId, status: { in: activeSosStatuses } },
      });
      await tx.booking.update({
        where: { id: existing.bookingId },
        data: { sosTriggered: active > 0 },
      });
    }
    return data;
  }

  async getIncidents() {
    const data = await this.prisma.safetyIncident.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return { data, message: 'Safety incidents fetched' };
  }

  async getIncident(id: string) {
    const data = await this.prisma.safetyIncident.findUnique({ where: { id } });
    if (!data) throw new NotFoundException('Incident not found');
    return { data, message: 'Incident fetched' };
  }

  async updateIncident(
    id: string,
    status: IncidentStatus,
    note: string | undefined,
    user: AuthStaffPayload,
  ) {
    const existing = await this.prisma.safetyIncident.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Incident not found');
    const priorNotes = Array.isArray(existing.investigatorNotes) ? existing.investigatorNotes : [];
    const notes = note?.trim()
      ? [
          ...priorNotes,
          { timestamp: new Date().toISOString(), note: note.trim(), author: user.name },
        ]
      : priorNotes;
    const data = await this.prisma.safetyIncident.update({
      where: { id },
      data: {
        status,
        ...(status === IncidentStatus.ESCALATED_LEGAL ? { legalEscalation: true } : {}),
        investigatorNotes: notes as Prisma.InputJsonValue,
        assignedInvestigatorId: existing.assignedInvestigatorId ?? user.sub,
      },
    });
    return { data, message: 'Incident status updated' };
  }

  async toggleEvidenceHold(id: string) {
    const existing = await this.prisma.safetyIncident.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Incident not found');
    const data = await this.prisma.safetyIncident.update({
      where: { id },
      data: { preserveEvidence: !existing.preserveEvidence },
    });
    return { data, message: 'Evidence hold updated' };
  }

  async getGeofenceAlerts(user: AuthStaffPayload) {
    const cityIds = this.cityScope(user);
    let allowedZoneIds: string[] | undefined;
    if (cityIds) {
      const zones = await this.prisma.geofenceZone.findMany({
        where: { cityId: { in: cityIds } },
        select: { id: true },
      });
      allowedZoneIds = zones.map((zone) => zone.id);
    }
    const events = await this.prisma.geofenceAlertEvent.findMany({
      where: allowedZoneIds ? { zoneId: { in: allowedZoneIds } } : {},
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    const data = await Promise.all(
      events.map(async (event) => {
        const [zone, companion, booking] = await Promise.all([
          this.prisma.geofenceZone.findUnique({
            where: { id: event.zoneId },
            select: { zoneName: true },
          }),
          event.userType === 'COMPANION'
            ? this.prisma.companion.findUnique({
                where: { id: event.userId },
                select: { id: true, name: true },
              })
            : Promise.resolve(null),
          event.bookingId
            ? this.prisma.booking.findUnique({
                where: { id: event.bookingId },
                select: { id: true, bookingRef: true },
              })
            : Promise.resolve(null),
        ]);
        return {
          ...event,
          companionId: companion?.id ?? (event.userType === 'COMPANION' ? event.userId : ''),
          companionName: companion?.name ?? 'Unknown',
          sessionId: booking?.bookingRef ?? event.bookingId ?? '',
          expectedLocation: zone?.zoneName ?? event.zoneId,
          actualLocation: event.lat + ', ' + event.lng,
          breachSeverity:
            event.alertType === 'EXITED_CITY_LIMITS' || event.alertType === 'STATIONARY_TOO_LONG'
              ? 'HIGH'
              : 'MEDIUM',
          status: event.status,
        };
      }),
    );
    return { data, message: 'Geofence alerts fetched' };
  }

  async updateGeofenceStatus(id: string, status: string, user: AuthStaffPayload) {
    if (!Object.values(GeofenceAlertStatus).includes(status as GeofenceAlertStatus)) {
      throw new BadRequestException('Invalid geofence alert status');
    }
    const cityIds = this.cityScope(user);
    const zones = cityIds
      ? await this.prisma.geofenceZone.findMany({
          where: { cityId: { in: cityIds } },
          select: { id: true },
        })
      : undefined;
    const data = await this.prisma.geofenceAlertEvent.update({
      where: { id, ...(zones ? { zoneId: { in: zones.map((zone) => zone.id) } } : {}) },
      data: { seen: status === 'RESOLVED', status: status as GeofenceAlertStatus },
    });
    return { data, message: 'Geofence alert updated' };
  }

  async getAgeEscalations() {
    const cases = await this.prisma.minorAgeEscalation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    const data = await Promise.all(
      cases.map(async (item) => {
        const user =
          item.userType === 'COMPANION'
            ? await this.prisma.companion.findUnique({
                where: { id: item.userId },
                select: { name: true },
              })
            : await this.prisma.customer.findUnique({
                where: { id: item.userId },
                select: { name: true },
              });
        return {
          ...item,
          userName: user?.name ?? item.userId,
          dobMismatchDetails: item.reviewNote ?? 'Age verification requires manual review.',
          idEstimate: null,
          selfieEstimate: null,
          associatedRecordLink: '/verification',
          timestamp: item.createdAt,
        };
      }),
    );
    return { data, message: 'Age escalations fetched' };
  }

  async updateAgeEscalation(
    id: string,
    status: string,
    note: string | undefined,
    user: AuthStaffPayload,
  ) {
    const data = await this.prisma.minorAgeEscalation.update({
      where: { id },
      data: {
        status,
        ...(note !== undefined ? { reviewNote: note } : {}),
        reviewedById: user.sub,
      },
    });
    return { data, message: 'Age escalation updated' };
  }

  async getEmergencyWorkflows(user: AuthStaffPayload) {
    const cityIds = this.cityScope(user);
    const alerts = await this.prisma.sOSAlert.findMany({
      where: {
        ...(cityIds ? { booking: { cityId: { in: cityIds } } } : {}),
        status: { in: activeSosStatuses },
      },
      include: { booking: { select: { id: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const data = await Promise.all(
      alerts.map(async (alert) => {
        const log = alert.bookingId
          ? await this.prisma.sessionAuditLog.findMany({
              where: { bookingId: alert.bookingId, eventType: { startsWith: 'ADMIN_' } },
              orderBy: { timestamp: 'asc' },
            })
          : [];
        const status =
          alert.status === SOSStatus.TRIGGERED
            ? 'STEP_1_CONTACT_USER'
            : alert.status === SOSStatus.ESCALATED_AUTHORITIES
              ? 'STEP_3_LEGAL_HOLD'
              : 'STEP_2_DISPATCH_AUTHORITIES';
        return {
          id: alert.id,
          sosAlertId: alert.id,
          status,
          createdAt: alert.createdAt,
          log: log.map((entry) => ({
            timestamp: entry.timestamp,
            action: entry.eventType + (entry.details ? ': ' + JSON.stringify(entry.details) : ''),
            handledBy: entry.actorId ?? 'System',
          })),
        };
      }),
    );
    return { data, message: 'Emergency workflows fetched' };
  }

  async advanceEmergencyWorkflow(
    id: string,
    status: string,
    action: string,
    user: AuthStaffPayload,
  ) {
    const statusMap: Record<string, SOSStatus> = {
      STEP_1_CONTACT_USER: SOSStatus.ACKNOWLEDGED,
      STEP_2_DISPATCH_AUTHORITIES: SOSStatus.INVESTIGATING,
      STEP_3_LEGAL_HOLD: SOSStatus.ESCALATED_AUTHORITIES,
      RESOLVED: SOSStatus.RESOLVED_REAL_INCIDENT,
    };
    const mapped = statusMap[status];
    if (!mapped) throw new BadRequestException('Invalid emergency workflow status');
    const updated = await this.prisma.$transaction(
      async (tx) => {
        const result = await this.writeSosStatus(tx, id, mapped, action, user);
        if (result.bookingId) {
          await tx.sessionAuditLog.create({
            data: {
              bookingId: result.bookingId,
              eventType: 'ADMIN_EMERGENCY_WORKFLOW',
              actorId: user.sub,
              actorType: 'ADMIN',
              details: { status, action, handler: user.name },
            },
          });
        }
        return result;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return { data: updated, message: 'Emergency workflow advanced' };
  }
}
