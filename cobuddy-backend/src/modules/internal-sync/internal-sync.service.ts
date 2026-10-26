import { Injectable, Logger, ConflictException, BadRequestException } from '@nestjs/common';
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
    return BookingStatus.PENDING_COMPANION_ACCEPT;
  }

  async syncBooking(dto: SyncBookingDto) {
    this.logger.log(`[Admin S2S Sync] Syncing booking ${dto.bookingId} with status ${dto.status}`);

    const mappedStatus = this.mapBookingStatus(dto.status);

    // Fast path: If booking already exists in Admin DB, update status and audit log directly
    const existingBooking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
    });

    if (existingBooking) {
      if (existingBooking.status === mappedStatus ||
        ['COMPLETED', 'CUSTOMER_CANCELLED', 'COMPANION_CANCELLED', 'REJECTED_BY_COMPANION', 'NO_SHOW_CUSTOMER', 'NO_SHOW_COMPANION'].includes(existingBooking.status) ||
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

    // Ensure customer exists
    let customer: any = null;
    if (dto.byCustomerId || dto.toCustomerId) {
      const cId = dto.byCustomerId || dto.toCustomerId;
      customer = await this.prisma.customer.findUnique({ where: { id: cId } });
      if (!customer) {
        // Fallback default city
        const city = await this.prisma.city.findFirst() || await this.prisma.city.create({
          data: {
            cityCode: 'BLR',
            name: { en: 'Bengaluru' },
            state: 'Karnataka',
            country: 'India',
          },
        });
        customer = await this.prisma.customer.create({
          data: {
            id: cId!,
            name: 'Customer',
            phone: `+91${Date.now().toString().slice(-10)}`,
            passwordHash: '',
            cityId: city.id,
          },
        });
      }
    }

    // Ensure companion exists
    let companion: any = null;
    if (dto.toCompanionId || dto.byCompanionId) {
      const compId = dto.toCompanionId || dto.byCompanionId;
      companion = await this.prisma.companion.findUnique({ where: { id: compId } });
      if (!companion) {
        const city = await this.prisma.city.findFirst() || await this.prisma.city.create({
          data: {
            cityCode: 'BLR',
            name: { en: 'Bengaluru' },
            state: 'Karnataka',
            country: 'India',
          },
        });
        companion = await this.prisma.companion.create({
          data: {
            id: compId!,
            name: 'Companion',
            phone: `+91${Date.now().toString().slice(-10)}`,
            passwordHash: '',
            gender: 'Female',
            cityId: city.id,
          },
        });
      }
    }

    const review = await this.prisma.review.upsert({
      where: {
        bookingId_byCustomerId_toCompanionId: {
          bookingId: dto.bookingId,
          byCustomerId: dto.byCustomerId || customer?.id || '',
          toCompanionId: dto.toCompanionId || companion?.id || '',
        },
      },
      update: {
        rating: Math.round(dto.rating),
        text: dto.text,
        tagCodes: dto.tagCodes || [],
        moderationStatus: ReviewModerationStatus.APPROVED,
      },
      create: {
        bookingId: dto.bookingId,
        byCustomerId: dto.byCustomerId || customer?.id || '',
        toCompanionId: dto.toCompanionId || companion?.id,
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
