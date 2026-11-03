import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { BookingStatus, Prisma, ReviewModerationStatus, VerificationStatus, VerificationApplicantType, UserVerificationStatus, SupportTicketPriority, SupportTicketStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { SyncBookingDto } from './dto/sync-booking.dto';
import { SyncReviewDto } from './dto/sync-review.dto';
import { SyncVerificationCaseDto } from './dto/sync-verification-case.dto';
import { SyncCompanionApplicationDto } from './dto/sync-companion-application.dto';
import { SyncUserReportDto } from './dto/sync-user-report.dto';
import { SyncTicketDto, SyncTicketMessageDto } from './dto/sync-ticket.dto';
import { randomUUID } from 'crypto';

// Internal S2S mirrors cannot authenticate; this is a non-credential sentinel.
const S2S_MANAGED_NO_LOGIN_HASH = '!S2S_MANAGED_NO_LOGIN!';

@Injectable()
export class InternalSyncService {
  private readonly logger = new Logger(InternalSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  private cityLabel(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
    const labels = value as Record<string, unknown>;
    const label = labels.en ?? Object.values(labels).find((item) => typeof item === 'string');
    return typeof label === 'string' ? label.trim() : '';
  }

  private async resolveActiveCity(cityId?: string, cityName?: string, required = false): Promise<any | null> {
    if (cityId) {
      const city = await this.prisma.city.findUnique({ where: { id: cityId } });
      if (!city?.active) throw new BadRequestException('The supplied city mapping is not active.');
      return city;
    }

    const normalizedName = cityName?.trim().toLowerCase();
    if (!normalizedName) {
      if (required) throw new BadRequestException('An existing active city mapping is required.');
      return null;
    }

    const cities = await this.prisma.city.findMany({ where: { active: true } });
    const city = cities.find((candidate) =>
      candidate.cityCode.trim().toLowerCase() === normalizedName ||
      this.cityLabel(candidate.name).toLowerCase() === normalizedName,
    );
    if (!city) throw new BadRequestException('No active Admin city matches the supplied city.');
    return city;
  }

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

    if (!dto.customerId || !dto.companionId) {
      throw new BadRequestException('Authoritative customer and companion mapping is required.');
    }
    if (!dto.startTime || !dto.endTime || !Number.isInteger(dto.durationMins) || dto.durationMins! <= 0 ||
      !dto.activityName?.trim() || !dto.venueName?.trim() || !dto.paymentStatus?.trim() ||
      dto.bookingAmount === undefined || dto.platformFeeAmount === undefined || dto.companionNetAmount === undefined) {
      throw new BadRequestException('A complete authoritative booking snapshot is required.');
    }
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    const amounts = [dto.bookingAmount, dto.platformFeeAmount, dto.companionNetAmount];
    if (!Number.isFinite(startTime.getTime()) || !Number.isFinite(endTime.getTime()) || endTime <= startTime ||
      amounts.some((amount) => !Number.isFinite(amount) || amount < 0)) {
      throw new BadRequestException('The authoritative booking snapshot contains invalid dates or amounts.');
    }

    // Resolve only an existing city from the upstream identity; never assign a
    // booking to an arbitrary active city or create a default city at runtime.
    const city = await this.resolveActiveCity(dto.cityId, dto.cityName || dto.venueCity, true);

    // Resolve both identities before writing either one, so incomplete input
    // cannot leave a partially-created Admin mirror.
    const [existingCustomer, existingCompanion] = await Promise.all([
      this.prisma.customer.findUnique({ where: { id: dto.customerId } }),
      this.prisma.companion.findUnique({ where: { id: dto.companionId } }),
    ]);
    if (!existingCustomer && (!dto.customerName?.trim() || !dto.customerPhone?.trim())) {
      throw new BadRequestException('Real customer name and phone are required to create an Admin mirror.');
    }
    if (!existingCompanion && (!dto.companionName?.trim() || !dto.companionPhone?.trim())) {
      throw new BadRequestException('Real companion name and phone are required to create an Admin mirror.');
    }

    // Create mirrors only from actual source identity data.
    let customer = existingCustomer;
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          id: dto.customerId,
          name: dto.customerName!.trim(),
          phone: dto.customerPhone!.trim(),
          passwordHash: S2S_MANAGED_NO_LOGIN_HASH,
          status: 'ACTIVE',
          verificationStatus: UserVerificationStatus.PENDING,
          cityId: city.id,
        },
      });
    } else if (customer && dto.customerName && customer.name !== dto.customerName) {
      await this.prisma.customer.update({
        where: { id: customer.id },
        data: { name: dto.customerName },
      });
    }

    // 3. Resolve or upsert Companion (ensure real name and phone)
    let companion = existingCompanion;
    if (!companion) {
      companion = await this.prisma.companion.create({
        data: {
          id: dto.companionId,
          name: dto.companionName!.trim(),
          phone: dto.companionPhone!.trim(),
          passwordHash: S2S_MANAGED_NO_LOGIN_HASH,
          gender: 'UNSPECIFIED',
          status: 'ACTIVE',
          verificationStatus: UserVerificationStatus.PENDING,
          cityId: city.id,
        },
      });
    } else if (companion && dto.companionName && companion.name !== dto.companionName) {
      await this.prisma.companion.update({
        where: { id: companion.id },
        data: { name: dto.companionName },
      });
    }

    const customerId = customer.id;
    const durationMins = dto.durationMins!;

    const bookingRef = dto.bookingRef || `BK-${dto.bookingId.slice(0, 8).toUpperCase()}`;

    const venueSnapshot = {
      name: dto.venueName,
      address: dto.venueAddress || '',
      area: dto.venueArea || '',
      city: dto.venueCity || this.cityLabel(city.name),
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
        customerId,
        companionId: companion ? companion.id : null,
        cityId: city.id,
        activityLabel: dto.activityName,
        venueSnapshot,
        startTime,
        endTime,
        durationMins,
        status: mappedStatus,
        bookingAmount: new Prisma.Decimal(dto.bookingAmount),
        platformFeeAmount: new Prisma.Decimal(dto.platformFeeAmount),
        companionNetAmount: new Prisma.Decimal(dto.companionNetAmount),
        paymentStatus: dto.paymentStatus,
      },
    });

    // The Admin S2S booking payload is a status projection, not payment proof.
    // Do not invent wallet charges, Razorpay transaction IDs, matched
    // reconciliation rows, escrow schedules, or payouts here.

    // 7. Record Session Audit Log
    try {
      await this.prisma.sessionAuditLog.create({
        data: {
          bookingId: booking.id,
          eventType: `S2S_SYNC_${mappedStatus}`,
          actorId: customerId,
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

  // ── S2S: Sync Companion / Customer KYC to Verification Queue ──
  async syncVerificationCase(dto: SyncVerificationCaseDto) {
    this.logger.log(`[Admin S2S Sync] Syncing verification case for applicant ${dto.applicantId} (${dto.applicantType})`);
    if (!['CUSTOMER', 'COMPANION'].includes(dto.applicantType)) {
      throw new BadRequestException('Applicant type must be CUSTOMER or COMPANION.');
    }
    if (!dto.documentType?.trim() || !dto.idDocumentUrl?.trim() || !dto.selfieUrl?.trim()) {
      throw new BadRequestException('Real document type, document URL, and selfie URL are required.');
    }
    const city = await this.resolveActiveCity(undefined, dto.cityName, false);

    // Ensure applicant exists in Admin DB so scope and names resolve
    if (dto.applicantType === 'COMPANION') {
      const existingComp = await this.prisma.companion.findUnique({ where: { id: dto.applicantId } });
      if (!existingComp) {
        if (!dto.applicantName?.trim() || !dto.applicantPhone?.trim()) {
          throw new BadRequestException('Real companion name and phone are required for a new verification applicant.');
        }
        await this.prisma.companion.create({
          data: {
            id: dto.applicantId,
            name: dto.applicantName.trim(),
            phone: dto.applicantPhone.trim(),
            passwordHash: S2S_MANAGED_NO_LOGIN_HASH,
            gender: 'UNSPECIFIED',
            status: 'ACTIVE',
            verificationStatus: UserVerificationStatus.PENDING,
            cityId: city?.id ?? null,
          },
        });
      } else if (dto.applicantName && existingComp.name !== dto.applicantName) {
        await this.prisma.companion.update({
          where: { id: dto.applicantId },
          data: { name: dto.applicantName },
        });
      }
    } else {
      const existingCust = await this.prisma.customer.findUnique({ where: { id: dto.applicantId } });
      if (!existingCust) {
        if (!dto.applicantName?.trim() || !dto.applicantPhone?.trim()) {
          throw new BadRequestException('Real customer name and phone are required for a new verification applicant.');
        }
        await this.prisma.customer.create({
          data: {
            id: dto.applicantId,
            name: dto.applicantName.trim(),
            phone: dto.applicantPhone.trim(),
            passwordHash: S2S_MANAGED_NO_LOGIN_HASH,
            status: 'ACTIVE',
            verificationStatus: UserVerificationStatus.PENDING,
            cityId: city?.id ?? null,
          },
        });
      }
    }

    const caseRef = dto.caseRef || `VC-${dto.applicantType}-${dto.applicantId}`;

    const kycCase = await this.prisma.verificationCase.upsert({
      where: { caseRef },
      update: {
        documentType: dto.documentType,
        idDocumentUrl: dto.idDocumentUrl,
        selfieUrl: dto.selfieUrl,
        backgroundDeclarationUrl: dto.backgroundDeclarationUrl || null,
        status: VerificationStatus.PENDING_MANUAL_REVIEW,
        submittedAt: new Date(),
      },
      create: {
        caseRef,
        applicantId: dto.applicantId,
        applicantType: dto.applicantType as VerificationApplicantType,
        documentType: dto.documentType,
        idDocumentUrl: dto.idDocumentUrl,
        selfieUrl: dto.selfieUrl,
        backgroundDeclarationUrl: dto.backgroundDeclarationUrl || null,
        status: VerificationStatus.PENDING_MANUAL_REVIEW,
        submittedAt: new Date(),
      },
    });

    await this.prisma.verificationAuditEvent.create({
      data: {
        caseId: kycCase.id,
        action: 'SUBMITTED',
        actor: 'MOBILE_APP',
        notes: `Documents submitted via mobile onboarding`,
      },
    }).catch(() => {});

    return {
      success: true,
      message: 'Verification case synchronized to Admin Queue',
      caseId: kycCase.id,
      caseRef: kycCase.caseRef,
    };
  }

  // ── S2S: Sync Companion Application Onboarding Pipeline ──
  async syncCompanionApplication(dto: SyncCompanionApplicationDto) {
    this.logger.log(`[Admin S2S Sync] Syncing companion application for ${dto.companionId}`);

    const city = await this.resolveActiveCity(undefined, dto.cityName, true);

    // Ensure companion exists in Admin DB
    const existingComp = await this.prisma.companion.findUnique({ where: { id: dto.companionId } });
    if (!existingComp) {
      await this.prisma.companion.create({
        data: {
          id: dto.companionId,
          name: `${dto.firstName} ${dto.lastName}`.trim(),
          phone: dto.phone,
          email: dto.email,
          passwordHash: S2S_MANAGED_NO_LOGIN_HASH,
          gender: 'UNSPECIFIED',
          status: 'ACTIVE',
          verificationStatus: UserVerificationStatus.PENDING,
          cityId: city.id,
        },
      });
    }

    let appStatus = (dto.applicationStatus || 'SUBMITTED').toUpperCase();
    if (appStatus === 'PENDING') appStatus = 'SUBMITTED';
    if (appStatus === 'IN_REVIEW') appStatus = 'SCREENING';
    const app = await this.prisma.companionApplication.upsert({
      where: { companionId: dto.companionId },
      update: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        cityId: city.id,
        applicationStatus: appStatus,
        portfolioUrls: dto.portfolioUrls || [],
        cvUrl: dto.cvUrl || null,
      },
      create: {
        companionId: dto.companionId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        cityId: city.id,
        applicationStatus: appStatus,
        portfolioUrls: dto.portfolioUrls || [],
        cvUrl: dto.cvUrl || null,
      },
    });

    return {
      success: true,
      message: 'Companion application synchronized',
      applicationId: app.id,
    };
  }

  async syncUserReport(dto: SyncUserReportDto) {
    if (!['CUSTOMER', 'COMPANION'].includes(dto.reporterType || '') ||
      !['CUSTOMER', 'COMPANION'].includes(dto.reportedUserType || '') ||
      ['unknown', 'unknown_companion'].includes(dto.reportedUserId.trim().toLowerCase())) {
      throw new BadRequestException('A report must include real user IDs and explicit reporter and reported-user types.');
    }
    this.logger.log('[Admin S2S Sync] Syncing user report.');
    const reportRef = dto.reportRef || `REP-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let validBookingId: string | null = null;
    if (dto.bookingId) {
      const b = await this.prisma.booking.findUnique({ where: { id: dto.bookingId }, select: { id: true } });
      if (b) validBookingId = b.id;
    }

    const report = await this.prisma.userReport.create({
      data: {
        reportRef,
        reporterId: dto.reporterId,
        reporterType: dto.reporterType!.toUpperCase(),
        reportedUserId: dto.reportedUserId,
        reportedUserType: dto.reportedUserType!.toUpperCase(),
        categoryCode: dto.categoryCode,
        description: dto.description,
        evidenceUrls: dto.evidenceUrls || [],
        bookingId: validBookingId,
        status: 'OPEN',
      },
    });

    try {
      const incidentRef = `INC-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await this.prisma.safetyIncident.create({
        data: {
          incidentRef,
          incidentTypeCode: dto.categoryCode,
          involvedCustomerIds: dto.reporterType === 'CUSTOMER' ? [dto.reporterId] : [dto.reportedUserId],
          involvedCompanionIds: dto.reportedUserType === 'COMPANION' ? [dto.reportedUserId] : [dto.reporterId],
          description: dto.description,
          evidenceUrls: dto.evidenceUrls || [],
          bookingId: validBookingId,
          status: 'OPEN',
        },
      });
    } catch {
      this.logger.warn('Failed to mirror report into the Admin incident queue.');
    }

    return {
      success: true,
      message: 'User report synchronized to Admin Database',
      reportId: report.id,
      reportRef: report.reportRef,
      status: report.status,
    };
  }

  async getMasterDataBundle() {
    const [
      cities,
      areas,
      interests,
      languages,
      ticketCategories,
      incidentTypes,
      reviewTags,
      disputeReasons,
      cancellationReasons,
      placeTypes,
      sessionDurations,
      defaults,
    ] = await Promise.all([
      this.prisma.city.findMany({
        where: { active: true },
        include: { areas: { where: { active: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.area.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
      this.prisma.interest.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
      this.prisma.spokenLanguage.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
      this.prisma.ticketCategory.findMany({ where: { active: true } }),
      this.prisma.incidentType.findMany({ where: { active: true } }),
      this.prisma.reviewTagOption.findMany({ where: { active: true } }),
      this.prisma.disputeReason.findMany({ where: { active: true } }),
      this.prisma.cancellationReason.findMany({ where: { active: true } }),
      this.prisma.placeTypeConfig.findMany({ where: { isAllowed: true } }),
      this.prisma.sessionDurationOption.findMany({ where: { active: true } }),
      this.prisma.systemDefault.findUnique({ where: { id: 'singleton' } }),
    ]);

    return {
      success: true,
      data: {
        cities: cities.map((c) => ({
          id: c.id,
          cityCode: c.cityCode,
          name: this.cityLabel(c.name),
          state: c.state,
          areas: (c.areas || []).map((a) => ({ id: a.id, name: a.name })),
        })),
        areas: areas.map((a) => ({ id: a.id, name: a.name, cityId: a.cityId })),
        interests: interests.map((i) => ({ id: i.id, name: this.cityLabel(i.name), category: i.type, icon: i.icon })),
        languages: languages.map((l) => ({ code: l.code, name: this.cityLabel(l.name) })),
        ticketCategories,
        incidentTypes,
        reviewTags,
        disputeReasons,
        cancellationReasons,
        placeTypes,
        sessionDurations,
        defaults,
      },
      message: 'Master data bundle fetched successfully',
    };
  }

  async syncSupportTicket(dto: SyncTicketDto) {
    this.logger.log(`[Admin S2S Sync] Syncing support ticket from ${dto.userType} (${dto.userId}): ${dto.subject}`);

    let customerId: string | null = null;
    let companionId: string | null = null;
    let userName = dto.userName;

    if (dto.userType === 'CUSTOMER') {
      const customer = await this.prisma.customer.findUnique({ where: { id: dto.userId } });
      if (customer) {
        customerId = customer.id;
        if (!userName) userName = customer.name;
      }
    } else if (dto.userType === 'COMPANION') {
      const companion = await this.prisma.companion.findUnique({ where: { id: dto.userId } });
      if (companion) {
        companionId = companion.id;
        if (!userName) userName = companion.name;
      }
    }

    if (!userName) {
      userName = dto.userType === 'CUSTOMER' ? 'Customer' : 'Companion';
    }

    let priority: SupportTicketPriority = SupportTicketPriority.MEDIUM;
    if (dto.priority) {
      const p = dto.priority.toUpperCase();
      if (p === 'LOW') priority = SupportTicketPriority.LOW;
      else if (p === 'HIGH') priority = SupportTicketPriority.HIGH;
      else if (p === 'CRITICAL' || p === 'URGENT') priority = SupportTicketPriority.CRITICAL;
      else priority = SupportTicketPriority.MEDIUM;
    }

    const ticketId = dto.ticketId || randomUUID();
    const existing = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { messages: true },
    });

    if (existing) {
      if (dto.message) {
        const msgExists = existing.messages.some((m) => m.message === dto.message);
        if (!msgExists) {
          await this.prisma.ticketMessage.create({
            data: {
              ticketId: existing.id,
              senderId: dto.userId,
              senderType: dto.userType,
              message: dto.message,
            },
          });
        }
      }
      return {
        success: true,
        message: 'Ticket already exists in Admin, message synced',
        ticketId: existing.id,
        ticketRef: existing.ticketRef,
      };
    }

    const ticketRef = `TKT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const created = await this.prisma.supportTicket.create({
      data: {
        id: ticketId,
        ticketRef,
        userId: dto.userId,
        userName,
        userType: dto.userType,
        customerId,
        companionId,
        categoryCode: dto.categoryCode || 'GENERAL',
        priority,
        status: SupportTicketStatus.OPEN,
        subject: dto.subject,
        escalationLevel: 'L1',
        relatedBookingId: dto.relatedBookingId || null,
        messages: dto.message
          ? {
              create: {
                senderId: dto.userId,
                senderType: dto.userType,
                message: dto.message,
              },
            }
          : undefined,
      },
      include: { messages: true },
    });

    return {
      success: true,
      message: 'Support ticket successfully synced to Admin DB',
      ticketId: created.id,
      ticketRef: created.ticketRef,
    };
  }

  async syncTicketMessage(ticketId: string, dto: SyncTicketMessageDto) {
    this.logger.log(`[Admin S2S Sync] Syncing ticket message for ${ticketId} from ${dto.senderType}`);

    let ticket = await this.prisma.supportTicket.findFirst({
      where: {
        OR: [{ id: ticketId }, { ticketRef: ticketId }],
      },
    });

    if (!ticket) {
      let customerId: string | null = null;
      let companionId: string | null = null;
      let userName = dto.senderType === 'CUSTOMER' ? 'Customer' : 'Companion';

      if (dto.senderType === 'CUSTOMER') {
        const c = await this.prisma.customer.findUnique({ where: { id: dto.senderId } });
        if (c) {
          customerId = c.id;
          userName = c.name;
        }
      } else if (dto.senderType === 'COMPANION') {
        const comp = await this.prisma.companion.findUnique({ where: { id: dto.senderId } });
        if (comp) {
          companionId = comp.id;
          userName = comp.name;
        }
      }

      ticket = await this.prisma.supportTicket.create({
        data: {
          id: ticketId,
          ticketRef: `TKT-${ticketId.slice(0, 8)}`,
          userId: dto.senderId,
          userName,
          userType: dto.senderType,
          customerId,
          companionId,
          categoryCode: 'CONCIERGE',
          priority: SupportTicketPriority.MEDIUM,
          status: SupportTicketStatus.OPEN,
          subject: 'Concierge Support Inquiry',
          escalationLevel: 'L1',
        },
      });
    }

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: dto.senderId,
        senderType: dto.senderType,
        message: dto.message,
      },
    });

    if (['RESOLVED', 'CLOSED'].includes(ticket.status) && ['CUSTOMER', 'COMPANION'].includes(dto.senderType)) {
      await this.prisma.supportTicket.update({
        where: { id: ticket.id },
        data: { status: SupportTicketStatus.OPEN },
      });
    }

    return {
      success: true,
      message: 'Message synced to Admin ticket',
      messageId: message.id,
    };
  }

  async syncSosAlert(dto: any) {
    const alertRef = dto.alertRef || `SOS-${dto.id || Date.now()}`;
    const lat = Number.isFinite(dto.lat) ? Number(dto.lat) : 0;
    const lng = Number.isFinite(dto.lng) ? Number(dto.lng) : 0;
    const bookingId = dto.bookingId ? dto.bookingId : null;

    let validBookingId: string | null = null;
    if (bookingId) {
      const b = await this.prisma.booking.findUnique({ where: { id: bookingId } });
      if (b) validBookingId = b.id;
    }

    let sosStatus: any = 'TRIGGERED';
    if (dto.status) {
      const s = String(dto.status).toUpperCase();
      if (['TRIGGERED', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED_FALSE_ALARM', 'RESOLVED_REAL_INCIDENT', 'ESCALATED_AUTHORITIES'].includes(s)) {
        sosStatus = s;
      } else if (s === 'ACTIVE') {
        sosStatus = 'TRIGGERED';
      } else if (s === 'RESOLVED') {
        sosStatus = 'RESOLVED_REAL_INCIDENT';
      }
    }

    const sos = await this.prisma.sOSAlert.upsert({
      where: { alertRef },
      update: {
        lat,
        lng,
        status: sosStatus,
        authoritiesContacted: Boolean(dto.authoritiesContacted),
      },
      create: {
        alertRef,
        userId: dto.userId,
        userType: dto.userType,
        bookingId: validBookingId,
        lat,
        lng,
        status: sosStatus,
        authoritiesContacted: Boolean(dto.authoritiesContacted),
        audioClipUrl: dto.audioClipUrl || null,
      },
    });

    this.logger.warn(`🚨 [S2S SOS Sync] Recorded SOS Alert ${sos.alertRef} from ${dto.userType} ${dto.userId}`);
    return { data: sos, message: 'SOS Alert synchronized to Admin' };
  }
}
