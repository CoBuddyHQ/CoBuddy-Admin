import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BookingStatus, Prisma, RefundStatus, SOSStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.module';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { MatchmakingConfigDto } from './dto/matchmaking-config.dto';

const bookingInclude = {
  customer: { select: { id: true, name: true } },
  companion: { select: { id: true, name: true } },
  venue: true,
  disputes: { select: { refundAmount: true } },
};

type DisputeUiStatus =
  'OPEN' | 'INVESTIGATING' | 'RESOLVED_REFUND' | 'RESOLVED_NO_REFUND' | 'ESCALATED';

@Injectable()
export class OperationsApiService {
  constructor(private readonly prisma: PrismaService) {}

  async getMatchmakingConfig() {
    const config = await this.prisma.appConfig.findUnique({
      where: { configKey: 'operations.matchmaking' },
    });
    const data = config?.value ?? {
      maxSearchRadiusKm: 25,
      priorityAlgorithm: 'RATING_BASED',
      allowCrossCityBooking: false,
      minRatingThreshold: 3.5,
    };
    return { data, message: 'Matchmaking config fetched' };
  }

  async updateMatchmakingConfig(dto: MatchmakingConfigDto) {
    const value = {
      maxSearchRadiusKm: dto.maxSearchRadiusKm,
      priorityAlgorithm: dto.priorityAlgorithm,
      allowCrossCityBooking: dto.allowCrossCityBooking,
      minRatingThreshold: dto.minRatingThreshold,
    };
    const config = await this.prisma.appConfig.upsert({
      where: { configKey: 'operations.matchmaking' },
      create: {
        configKey: 'operations.matchmaking',
        value,
        description: 'Matchmaking settings managed by operations',
      },
      update: { value },
    });
    return { data: config.value, message: 'Matchmaking config updated' };
  }

  private bookingScope(user: AuthStaffPayload): Prisma.BookingWhereInput {
    if (user.roles.includes('SUPER_ADMIN')) return {};
    if (user.roles.includes('CITY_OPS_MANAGER')) {
      return {
        cityId: { in: user.cityScopeIds.length ? user.cityScopeIds : ['__no_city_scope__'] },
      };
    }
    return {};
  }

  async listBookings(statuses: BookingStatus[], user: AuthStaffPayload) {
    const data = await this.prisma.booking.findMany({
      where: { ...this.bookingScope(user), status: { in: statuses } },
      include: bookingInclude,
      orderBy: { startTime: 'desc' },
      take: 500,
    });
    return { data, message: 'Bookings fetched' };
  }

  async flagLiveSession(bookingId: string, user: AuthStaffPayload) {
    const booking = await this.prisma.booking.findFirst({
      where: { OR: [{ id: bookingId }, { bookingRef: bookingId }], ...this.bookingScope(user) },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    const data = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: { sosTriggered: true },
      });
      await tx.sessionAuditLog.create({
        data: {
          bookingId: booking.id,
          eventType: 'ADMIN_SAFETY_CHECK',
          actorId: user.sub,
          actorType: 'ADMIN',
          details: { triggeredAt: new Date().toISOString() },
        },
      });
      return updated;
    });
    return { data, message: 'Safety check recorded' };
  }

  async resolveLiveSessionSos(bookingId: string, user: AuthStaffPayload) {
    const booking = await this.prisma.booking.findFirst({
      where: { OR: [{ id: bookingId }, { bookingRef: bookingId }], ...this.bookingScope(user) },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    const data = await this.prisma.$transaction(
      async (tx) => {
        const updated = await tx.booking.update({
          where: { id: booking.id },
          data: { sosTriggered: false },
        });
        await tx.sOSAlert.updateMany({
          where: {
            bookingId: booking.id,
            status: {
              in: [
                SOSStatus.TRIGGERED,
                SOSStatus.ACKNOWLEDGED,
                SOSStatus.INVESTIGATING,
                SOSStatus.ESCALATED_AUTHORITIES,
              ],
            },
          },
          data: {
            status: SOSStatus.RESOLVED_FALSE_ALARM,
            resolvedById: user.sub,
            resolvedAt: new Date(),
            resolvedNote: 'Resolved from live sessions dashboard',
          },
        });
        await tx.sessionAuditLog.create({
          data: {
            bookingId: booking.id,
            eventType: 'ADMIN_RESOLVED_SOS',
            actorId: user.sub,
            actorType: 'ADMIN',
            details: { resolvedAt: new Date().toISOString() },
          },
        });
        return updated;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return { data, message: 'SOS alert resolved' };
  }

  async listSessionAudit(
    query: { sessionId?: string; dateFrom?: string; dateTo?: string },
    user: AuthStaffPayload,
  ) {
    const where: Prisma.SessionAuditLogWhereInput = {
      booking: this.bookingScope(user),
      ...(query.sessionId
        ? {
            booking: {
              ...this.bookingScope(user),
              OR: [{ id: query.sessionId }, { bookingRef: query.sessionId }],
            },
          }
        : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            timestamp: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
    };
    const data = await this.prisma.sessionAuditLog.findMany({
      where,
      include: { booking: { select: { id: true, bookingRef: true } } },
      orderBy: { timestamp: 'desc' },
      take: 500,
    });
    return { data, message: 'Session audit logs fetched' };
  }

  async listDisputes(user: AuthStaffPayload) {
    const data = await this.prisma.bookingDispute.findMany({
      where: { booking: this.bookingScope(user) },
      include: {
        booking: {
          include: {
            customer: { select: { id: true, name: true } },
            companion: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return { data, message: 'Booking disputes fetched' };
  }

  async updateDisputeStatus(id: string, status: DisputeUiStatus, note?: string, userId?: string) {
    const statusMap: Record<DisputeUiStatus, RefundStatus> = {
      OPEN: RefundStatus.REQUESTED,
      INVESTIGATING: RefundStatus.APPROVED,
      RESOLVED_REFUND: RefundStatus.PROCESSED,
      RESOLVED_NO_REFUND: RefundStatus.REJECTED,
      ESCALATED: RefundStatus.APPROVED,
    };
    if (!statusMap[status]) throw new BadRequestException('Invalid dispute status');
    const existing = await this.prisma.bookingDispute.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Booking dispute not found');
    const resolutionNote = note
      ? (status === 'ESCALATED' ? '[ESCALATED] ' : '') + note
      : existing.resolutionNote;
    const data = await this.prisma.bookingDispute.update({
      where: { id },
      data: {
        status: statusMap[status],
        resolutionNote,
        ...(status.startsWith('RESOLVED_') ? { resolvedAt: new Date(), resolvedBy: userId } : {}),
      },
    });
    return { data, message: 'Booking dispute updated' };
  }

  async overrideDisputePenalty(id: string, percent: number, reason: string, userId: string) {
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      throw new BadRequestException('Penalty percent must be between 0 and 100');
    }
    if (!reason?.trim()) throw new BadRequestException('An override reason is required');
    const existing = await this.prisma.bookingDispute.findUnique({
      where: { id },
      include: { booking: { select: { bookingAmount: true } } },
    });
    if (!existing) throw new NotFoundException('Booking dispute not found');
    const refundAmount = Number(existing.booking.bookingAmount) * (percent / 100);
    const data = await this.prisma.bookingDispute.update({
      where: { id },
      data: {
        refundAmount,
        resolutionNote: 'Penalty override ' + percent + '%: ' + reason.trim(),
        status: RefundStatus.APPROVED,
        resolvedBy: userId,
      },
    });
    return { data, message: 'Dispute penalty updated' };
  }
}
