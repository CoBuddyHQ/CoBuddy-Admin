import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { BookingStatus, Prisma, RefundStatus, SOSStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.module';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { MatchmakingConfigDto } from './dto/matchmaking-config.dto';
import { OverrideDisputeRefundDto, UpdateDisputeStatusDto } from './dto/dispute.dto';

const bookingInclude = {
  customer: { select: { id: true, name: true } },
  companion: { select: { id: true, name: true } },
  venue: true,
  disputes: { select: { refundAmount: true } },
};

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

  private async writableDispute(
    tx: Prisma.TransactionClient,
    id: string,
    version: number,
    user: AuthStaffPayload,
  ) {
    const existing = await tx.bookingDispute.findFirst({
      where: { id, booking: this.bookingScope(user) },
      include: { booking: { select: { bookingAmount: true } } },
    });
    if (!existing) throw new NotFoundException('Booking dispute not found');
    if (existing.version !== version)
      throw new ConflictException('Dispute changed; reload before updating');
    if (!['OPEN', 'INVESTIGATING', 'ESCALATED'].includes(existing.workflowStatus)) {
      throw new ConflictException(
        'This dispute is closed or has a refund awaiting finance processing',
      );
    }
    return existing;
  }

  async updateDisputeStatus(id: string, dto: UpdateDisputeStatusDto, user: AuthStaffPayload) {
    const data = await this.prisma.$transaction(
      async (tx) => {
        const existing = await this.writableDispute(tx, id, dto.version, user);
        let refundId: string | undefined;
        if (dto.status === 'REFUND_PENDING') {
          if (!existing.refundAmount?.gt(0) || existing.overridePercent === null) {
            throw new BadRequestException(
              'Set and review a positive refund amount before requesting a refund',
            );
          }
          const otherRefund = await tx.refund.findFirst({
            where: {
              bookingId: existing.bookingId,
              status: { in: ['REQUESTED', 'APPROVED', 'PROCESSED'] },
            },
          });
          if (otherRefund)
            throw new ConflictException(
              'A refund already exists for this booking; review it in Finance',
            );
          const refund = await tx.refund.create({
            data: {
              bookingId: existing.bookingId,
              requestedById: user.sub,
              requestedByType: 'STAFF',
              amount: existing.refundAmount,
              reason: existing.overrideReason ?? existing.description,
            },
          });
          refundId = refund.id;
        }
        if (dto.status === 'RESOLVED_NO_REFUND' && !dto.note?.trim()) {
          throw new BadRequestException('A resolution note is required');
        }
        const claim = await tx.bookingDispute.updateMany({
          where: { id, version: dto.version, booking: this.bookingScope(user) },
          data: {
            workflowStatus: dto.status,
            status:
              dto.status === 'RESOLVED_NO_REFUND' ? RefundStatus.REJECTED : RefundStatus.APPROVED,
            version: { increment: 1 },
            refundId,
            ...(dto.note !== undefined ? { resolutionNote: dto.note.trim() } : {}),
            ...(dto.status === 'RESOLVED_NO_REFUND'
              ? { resolvedAt: new Date(), resolvedBy: user.sub }
              : {}),
          },
        });
        if (claim.count !== 1)
          throw new ConflictException('Dispute changed; reload before updating');
        return tx.bookingDispute.findUnique({ where: { id } });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return {
      data,
      message:
        dto.status === 'REFUND_PENDING'
          ? 'Refund requested for finance review'
          : 'Booking dispute updated',
    };
  }

  async overrideDisputePenalty(id: string, dto: OverrideDisputeRefundDto, user: AuthStaffPayload) {
    const data = await this.prisma.$transaction(
      async (tx) => {
        const existing = await this.writableDispute(tx, id, dto.version, user);
        const refundAmount = existing.booking.bookingAmount
          .mul(dto.percent)
          .div(100)
          .toDecimalPlaces(2);
        const claim = await tx.bookingDispute.updateMany({
          where: { id, version: dto.version, booking: this.bookingScope(user) },
          data: {
            refundAmount,
            overridePercent: dto.percent,
            overrideReason: dto.reason.trim(),
            version: { increment: 1 },
          },
        });
        if (claim.count !== 1)
          throw new ConflictException('Dispute changed; reload before updating');
        return tx.bookingDispute.findUnique({ where: { id } });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return { data, message: 'Dispute refund amount updated' };
  }
}
