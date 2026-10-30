import { Injectable, Logger, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { BookingStatus, Prisma, ReviewModerationStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { SyncBookingDto } from './dto/sync-booking.dto';
import { SyncReviewDto } from './dto/sync-review.dto';

@Injectable()
export class InternalSyncService {
  private readonly logger = new Logger(InternalSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  private mapBookingStatus(statusStr: string): BookingStatus {
    const s = (statusStr || '').toUpperCase();
    if (['ACCEPTED', 'CONFIRMED', 'ARRIVING', 'UPCOMING'].includes(s)) {
      return BookingStatus.ARRIVING;
    }
    if (['IN_PROGRESS', 'ACTIVE'].includes(s)) {
      return BookingStatus.IN_PROGRESS;
    }
    if (['EXTENDED'].includes(s)) {
      return BookingStatus.EXTENDED;
    }
    if (['COMPLETED'].includes(s)) {
      return BookingStatus.COMPLETED;
    }
    if (['CANCELLED', 'CUSTOMER_CANCELLED'].includes(s)) {
      return BookingStatus.CUSTOMER_CANCELLED;
    }
    if (['COMPANION_CANCELLED'].includes(s)) {
      return BookingStatus.COMPANION_CANCELLED;
    }
    if (['REJECTED', 'REJECTED_BY_COMPANION', 'DECLINED'].includes(s)) {
      return BookingStatus.REJECTED_BY_COMPANION;
    }
    if (['NO_SHOW_CUSTOMER'].includes(s)) {
      return BookingStatus.NO_SHOW_CUSTOMER;
    }
    if (['NO_SHOW_COMPANION'].includes(s)) {
      return BookingStatus.NO_SHOW_COMPANION;
    }
    if (['PENDING', 'REQUESTED', 'COUNTER_PROPOSED', 'PENDING_COMPANION_ACCEPT'].includes(s)) {
      return BookingStatus.PENDING_COMPANION_ACCEPT;
    }
    throw new BadRequestException('Unsupported source booking status');
  }

  async syncBooking(dto: SyncBookingDto) {
    this.logger.log(`[Admin S2S Sync] Syncing booking ${dto.bookingId} with status ${dto.status}`);

    const mappedStatus = this.mapBookingStatus(dto.status);

    // Fast path: If booking already exists in Admin DB, update status and audit log directly
    const existingBooking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
    });

    if (existingBooking) {
      if ((existingBooking.status === mappedStatus &&
          (!dto.paymentStatus || dto.paymentStatus === existingBooking.paymentStatus) &&
          (!dto.cancelReason || dto.cancelReason === existingBooking.adminCancelNote)) ||
        (existingBooking.status !== mappedStatus && ['COMPLETED', 'CUSTOMER_CANCELLED', 'COMPANION_CANCELLED', 'REJECTED_BY_COMPANION', 'NO_SHOW_CUSTOMER', 'NO_SHOW_COMPANION'].includes(existingBooking.status)) ||
        (['IN_PROGRESS', 'EXTENDED'].includes(existingBooking.status) && ['ARRIVING', 'PENDING_COMPANION_ACCEPT'].includes(mappedStatus))) {
        return { success: true, ignored: true, bookingId: existingBooking.id, status: existingBooking.status };
      }
      const updated = await this.prisma.booking.update({
        where: { id: dto.bookingId, status: existingBooking.status },
        data: {
          status: mappedStatus,
          statusChangedAt: new Date(),
          ...(dto.paymentStatus ? { paymentStatus: dto.paymentStatus } : {}),
          ...(dto.cancelReason ? { adminCancelNote: dto.cancelReason } : {}),
        },
      });

      try {
        await this.prisma.sessionAuditLog.create({
          data: {
            bookingId: updated.id,
            eventType: `S2S_SYNC_${mappedStatus}`,
            actorId: existingBooking.customerId,
            actorType: 'MOBILE_APP',
            details: {
              sourceStatus: dto.status,
              adminStatus: mappedStatus,
              syncedAt: new Date().toISOString(),
            },
          },
        });
      } catch {
        // Non-blocking
      }

      return {
        success: true,
        message: 'Booking status successfully updated in Admin Database',
        bookingId: updated.id,
        status: updated.status,
      };
    }

    // 1. Resolve or create City
    // Source identities and city scope must already be explicitly mapped. Never invent
    // phone numbers, gender, KYC approval or city records to make synchronization pass.
    const city = dto.cityId ? await this.prisma.city.findUnique({ where: { id: dto.cityId } }) : null;
    const customer = dto.customerId ? await this.prisma.customer.findUnique({ where: { id: dto.customerId } }) : null;
    const companion = dto.companionId ? await this.prisma.companion.findUnique({ where: { id: dto.companionId } }) : null;
    if (!city || !customer || (dto.companionId && !companion)) {
      throw new ConflictException('Authoritative customer, companion and city mapping is required before synchronizing a new booking');
    }
    if (!dto.startTime || !dto.endTime || !dto.durationMins || !dto.activityName || !dto.venueName ||
      dto.bookingAmount === undefined || dto.platformFeeAmount === undefined || dto.companionNetAmount === undefined || !dto.paymentStatus) {
      throw new BadRequestException('A complete authoritative booking snapshot is required');
    }
    const startTime = dto.startTime ? new Date(dto.startTime) : new Date();
    const durationMins = dto.durationMins || 120;
    const endTime = dto.endTime ? new Date(dto.endTime) : new Date(startTime.getTime() + durationMins * 60 * 1000);

    const bookingRef = dto.bookingRef || `BK-${dto.bookingId.slice(0, 8).toUpperCase()}`;

    const venueSnapshot = {
      name: dto.venueName || 'Designated Venue',
      address: dto.venueAddress || '',
      area: dto.venueArea || '',
      city: dto.venueCity || city.cityCode,
    };

    const booking = await this.prisma.booking.upsert({
      where: { id: dto.bookingId },
      update: {
        status: mappedStatus,
        statusChangedAt: new Date(),
        paymentStatus: dto.paymentStatus,
        adminCancelNote: dto.cancelReason,
        ...(companion ? { companionId: companion.id } : {}),
      },
      create: {
        id: dto.bookingId,
        bookingRef,
        customerId: customer.id,
        companionId: companion ? companion.id : null,
        cityId: city.id,
        activityLabel: dto.activityName || 'Coffee & Conversation',
        venueSnapshot,
        startTime,
        endTime,
        durationMins,
        status: mappedStatus,
        bookingAmount: new Prisma.Decimal(dto.bookingAmount || 0),
        platformFeeAmount: new Prisma.Decimal(dto.platformFeeAmount || 0),
        companionNetAmount: new Prisma.Decimal(dto.companionNetAmount || 0),
        paymentStatus: dto.paymentStatus,
      },
    });

    // 6. Record Session Audit Log
    try {
      await this.prisma.sessionAuditLog.create({
        data: {
          bookingId: booking.id,
          eventType: `S2S_SYNC_${mappedStatus}`,
          actorId: customer.id,
          actorType: 'MOBILE_APP',
          details: {
            sourceStatus: dto.status,
            adminStatus: mappedStatus,
            syncedAt: new Date().toISOString(),
          },
        },
      });
    } catch {
      // Non-blocking audit log
    }

    return {
      success: true,
      message: 'Booking successfully synchronized to Admin Database',
      bookingId: booking.id,
      status: booking.status,
    };
  }

  async syncReview(dto: SyncReviewDto) {
    this.logger.log(`[Admin S2S Sync] Syncing review for booking ${dto.bookingId}`);
    const customerAuthored = Boolean(dto.byCustomerId);
    const companionAuthored = Boolean(dto.byCompanionId);
    if (customerAuthored === companionAuthored) {
      throw new BadRequestException('A review must identify exactly one author.');
    }
    if (customerAuthored && !dto.toCompanionId) {
      throw new BadRequestException('A customer review must identify its companion recipient.');
    }
    if (companionAuthored && !dto.toCustomerId) {
      throw new BadRequestException('A companion review must identify its customer recipient.');
    }

    const customerId = dto.byCustomerId || dto.toCustomerId!;
    const companionId = dto.toCompanionId || dto.byCompanionId!;
    const [customer, companion] = await Promise.all([
      this.prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } }),
      this.prisma.companion.findUnique({ where: { id: companionId }, select: { id: true } }),
    ]);
    if (!customer) {
      throw new NotFoundException('Review customer is not synchronized to Admin yet.');
    }
    if (!companion) {
      throw new NotFoundException('Review companion is not synchronized to Admin yet.');
    }

    const where = customerAuthored
      ? {
          bookingId_byCustomerId_toCompanionId: {
            bookingId: dto.bookingId,
            byCustomerId: dto.byCustomerId!,
            toCompanionId: dto.toCompanionId!,
          },
        }
      : {
          bookingId_byCompanionId_toCustomerId: {
            bookingId: dto.bookingId,
            byCompanionId: dto.byCompanionId!,
            toCustomerId: dto.toCustomerId!,
          },
        };
    const review = await this.prisma.review.upsert({
      where,
      update: {
        rating: Math.round(dto.rating),
        text: dto.text,
        tagCodes: dto.tagCodes || [],
        moderationStatus: ReviewModerationStatus.APPROVED,
      },
      create: {
        bookingId: dto.bookingId,
        byCustomerId: dto.byCustomerId,
        toCompanionId: dto.toCompanionId,
        byCompanionId: dto.byCompanionId,
        toCustomerId: dto.toCustomerId,
        rating: Math.round(dto.rating),
        text: dto.text,
        tagCodes: dto.tagCodes || [],
        moderationStatus: ReviewModerationStatus.APPROVED,
      },
    });

    return {
      success: true,
      message: 'Review successfully synchronized to Admin Database',
      reviewId: review.id,
    };
  }
}
