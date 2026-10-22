import {
  ConflictException,
  BadRequestException,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '@/prisma/prisma.module';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { cityWhere, requireCity, requireGlobal, scopedCities } from '@/common/auth/city-scope';
import { label } from '@/common/utils/localized-label';
import { AnnouncementUpdateInput, NotificationInput } from '@/common/validation/workflow-inputs';

@Injectable()
export class MarketingService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private working = false;
  constructor(
    private readonly db: PrismaService,
    private readonly config: ConfigService,
  ) {}
  private get endpoint() {
    return this.config.get<string>('NOTIFICATION_DELIVERY_URL');
  }
  private get token() {
    return this.config.get<string>('NOTIFICATION_DELIVERY_TOKEN');
  }
  onModuleInit() {
    if (this.endpoint && this.token) {
      this.timer = setInterval(() => {
        void this.dispatchDue().catch(() => undefined);
      }, 15000);
      this.timer.unref();
    }
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  private scope(user: AuthStaffPayload): Prisma.AnnouncementWhereInput {
    const cities = scopedCities(user);
    return cities ? { targetAudience: 'CITY_SPECIFIC', targetCityIds: { hasSome: cities } } : {};
  }
  async notifications(user: AuthStaffPayload) {
    return (
      await this.db.announcement.findMany({
        where: this.scope(user),
        orderBy: { createdAt: 'desc' },
      })
    ).map((a) => ({
      id: a.id,
      title: label(a.title),
      message: label(a.body),
      category: a.category,
      targetAudience: a.targetAudience,
      targetCity: a.targetCityIds[0],
      status: a.status,
      isPublished: a.isPublished,
      expiresAt: a.expiresAt,
      scheduledFor: a.scheduledFor,
      sentAt: a.sentAt,
      failureReason: a.failureReason,
    }));
  }
  async activeAnnouncements(customerCity?: string) {
    return this.activeAnnouncementsFor(['ALL', 'CUSTOMERS'], customerCity);
  }

  async activeCompanionAnnouncements() {
    return this.activeAnnouncementsFor(['ALL', 'COMPANIONS']);
  }

  private async resolveCity(name?: string) {
    if (!name?.trim()) return undefined;
    const cities = await this.db.city.findMany({
      where: { active: true },
      select: { id: true, name: true },
    });
    const normalized = name.trim().toLowerCase();
    const matches = cities.filter((city) => label(city.name).trim().toLowerCase() === normalized);
    // The Customer database has a city name, not a shared city ID or country.
    // Never guess an alias or choose between places with the same name.
    return matches.length === 1
      ? { id: matches[0].id, name: label(matches[0].name).trim() }
      : undefined;
  }

  private async assertCityCanPublish(cityIds: string[]) {
    if (cityIds.length !== 1) {
      throw new BadRequestException('Choose one active city for this campaign.');
    }
    const city = await this.db.city.findUnique({ where: { id: cityIds[0] } });
    const resolved = city?.active ? await this.resolveCity(label(city.name)) : undefined;
    if (!resolved || resolved.id !== cityIds[0]) {
      throw new BadRequestException(
        'The selected city must have a unique active English name for customer campaign eligibility.',
      );
    }
  }

  private async activeAnnouncementsFor(targetAudiences: string[], customerCity?: string) {
    const city = await this.resolveCity(customerCity);
    const now = new Date();
    const list = await this.db.announcement.findMany({
      where: {
        isPublished: true,
        publishedAt: { lte: now },
        AND: [
          {
            OR: [
              { targetAudience: { in: targetAudiences } },
              ...(city
                ? [{ targetAudience: 'CITY_SPECIFIC', targetCityIds: { has: city.id } }]
                : []),
            ],
          },
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return list.map((a) => ({
      id: a.id,
      title: label(a.title),
      message: label(a.body),
      category: a.category,
      targetAudience: a.targetAudience,
      ...(a.targetAudience === 'CITY_SPECIFIC' ? { targetCity: city?.name } : {}),
      isPublished: a.isPublished,
      publishedAt: a.publishedAt,
      expiresAt: a.expiresAt,
      status: a.status,
    }));
  }
  settings() {
    return {
      deliveryConfigured: !!(this.endpoint && this.token),
      provider: 'Server delivery gateway',
      schedulingEnabled: !!(this.endpoint && this.token),
    };
  }
  async create(input: NotificationInput, user: AuthStaffPayload) {
    if (input.targetAudience === 'CITY_SPECIFIC') {
      requireCity(user, input.targetCity!);
      await this.db.city.findUniqueOrThrow({ where: { id: input.targetCity! } });
    } else requireGlobal(user);
    if (input.status === 'SCHEDULED' && !this.settings().deliveryConfigured)
      throw new ServiceUnavailableException(
        'Configure the server notification delivery gateway before scheduling',
      );
    return this.db.announcement.create({
      data: {
        title: { en: input.title },
        body: { en: input.message },
        targetAudience: input.targetAudience,
        targetCityIds: input.targetAudience === 'CITY_SPECIFIC' ? [input.targetCity!] : [],
        publishedAt: new Date(),
        isPublished: false,
        createdById: user.sub,
        status: input.status,
        category: input.category,
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });
  }

  async updateAnnouncement(id: string, input: AnnouncementUpdateInput, user: AuthStaffPayload) {
    if (input.targetAudience === 'CITY_SPECIFIC') {
      requireCity(user, input.targetCity!);
      await this.db.city.findUniqueOrThrow({ where: { id: input.targetCity! } });
    } else requireGlobal(user);

    const current = await this.db.announcement.findFirst({
      where: { id, ...this.scope(user) },
      select: { isPublished: true, targetAudience: true, targetCityIds: true },
    });
    if (!current) throw new ConflictException('Announcement is unavailable');
    if (current.isPublished && input.targetAudience === 'CITY_SPECIFIC') {
      await this.assertCityCanPublish([input.targetCity!]);
    }

    const result = await this.db.announcement.updateMany({
      where: {
        id,
        ...this.scope(user),
        targetAudience: current.targetAudience,
        targetCityIds: { equals: current.targetCityIds },
        status: { notIn: ['QUEUED', 'SENDING'] },
      },
      data: {
        title: { en: input.title },
        body: { en: input.message },
        category: input.category,
        targetAudience: input.targetAudience,
        targetCityIds: input.targetAudience === 'CITY_SPECIFIC' ? [input.targetCity!] : [],
        ...(input.expiresAt !== undefined
          ? { expiresAt: input.expiresAt ? new Date(input.expiresAt) : null }
          : {}),
      },
    });
    if (!result.count)
      throw new ConflictException('Announcement is unavailable or currently sending');
    return this.db.announcement.findUniqueOrThrow({ where: { id } });
  }

  async publishAnnouncement(id: string, user: AuthStaffPayload) {
    const announcement = await this.db.announcement.findFirst({
      where: { id, ...this.scope(user) },
      select: { id: true, targetAudience: true, targetCityIds: true, expiresAt: true },
    });
    if (!announcement) throw new ConflictException('Announcement is unavailable');
    if (announcement.targetAudience === 'CITY_SPECIFIC') {
      await this.assertCityCanPublish(announcement.targetCityIds);
    }

    const now = new Date();
    if (announcement.expiresAt && announcement.expiresAt <= now) {
      throw new BadRequestException('Update the expiry before publishing this campaign.');
    }
    const result = await this.db.announcement.updateMany({
      where: {
        id,
        ...this.scope(user),
        targetAudience: announcement.targetAudience,
        targetCityIds: { equals: announcement.targetCityIds },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      data: { isPublished: true, publishedAt: now },
    });
    if (!result.count) throw new ConflictException('Announcement is unavailable');
    return { id, isPublished: true, publishedAt: now };
  }

  async unpublishAnnouncement(id: string, user: AuthStaffPayload) {
    const result = await this.db.announcement.updateMany({
      where: { id, ...this.scope(user), isPublished: true },
      data: { isPublished: false },
    });
    if (!result.count) throw new ConflictException('Published announcement is unavailable');
    return { id, isPublished: false };
  }
  async queue(id: string, user: AuthStaffPayload) {
    if (!this.settings().deliveryConfigured)
      throw new ServiceUnavailableException(
        'Delivery gateway is not configured. Draft was preserved; nothing was sent.',
      );
    const result = await this.db.announcement.updateMany({
      where: {
        id,
        ...this.scope(user),
        status: { in: ['DRAFT', 'SCHEDULED', 'FAILED', 'PARTIAL'] },
      },
      data: { status: 'QUEUED', failureReason: null, scheduledFor: null },
    });
    if (!result.count)
      throw new ConflictException('Broadcast is unavailable, already queued or sent');
    return { id, status: 'QUEUED' };
  }
  async receipts(id: string, user: AuthStaffPayload) {
    await this.db.announcement.findFirstOrThrow({ where: { id, ...this.scope(user) } });
    return this.db.broadcastDelivery.findMany({
      where: { announcementId: id },
      select: {
        recipientId: true,
        recipientType: true,
        status: true,
        attempts: true,
        providerId: true,
        failureReason: true,
        sentAt: true,
      },
    });
  }
  async dispatchDue() {
    if (this.working || !this.endpoint || !this.token) return;
    this.working = true;
    try {
      const broadcast = await this.db.announcement.findFirst({
        where: {
          OR: [
            { status: 'QUEUED' },
            { status: 'SCHEDULED', scheduledFor: { lte: new Date() } },
            { status: 'SENDING', dispatchLeaseExpiresAt: { lte: new Date() } },
          ],
        },
        orderBy: { createdAt: 'asc' },
      });
      if (!broadcast) return;
      const leaseId = randomUUID();
      const claimed = await this.db.announcement.updateMany({
        where: {
          id: broadcast.id,
          status: broadcast.status,
          ...(broadcast.status === 'SENDING'
            ? { dispatchLeaseExpiresAt: { lte: new Date() } }
            : {}),
        },
        data: {
          status: 'SENDING',
          dispatchLeaseId: leaseId,
          dispatchLeaseExpiresAt: new Date(Date.now() + 60000),
        },
      });
      if (!claimed.count) return;
      try {
        const where = {
          status: 'ACTIVE' as const,
          ...(broadcast.targetAudience === 'CITY_SPECIFIC'
            ? { cityId: { in: broadcast.targetCityIds } }
            : {}),
        };
        const [customers, companions] = await Promise.all([
          broadcast.targetAudience === 'COMPANIONS'
            ? []
            : this.db.customer.findMany({ where, select: { id: true } }),
          broadcast.targetAudience === 'CUSTOMERS'
            ? []
            : this.db.companion.findMany({ where, select: { id: true } }),
        ]);
        const recipients = [
          ...customers.map((c) => ({ recipientId: c.id, recipientType: 'CUSTOMER' })),
          ...companions.map((c) => ({ recipientId: c.id, recipientType: 'COMPANION' })),
        ];
        if (!recipients.length) throw new Error('No eligible recipients');
        // Freeze the audience on the first attempt. Retries never add new recipients.
        if (!(await this.db.broadcastDelivery.count({ where: { announcementId: broadcast.id } }))) {
          await this.db.broadcastDelivery.createMany({
            data: recipients.map((r) => ({ ...r, announcementId: broadcast.id })),
            skipDuplicates: true,
          });
        }
        const deliveries = await this.db.broadcastDelivery.findMany({
          where: { announcementId: broadcast.id, status: { not: 'SENT' } },
        });
        for (const delivery of deliveries) {
          const renewed = await this.db.announcement.updateMany({
            where: { id: broadcast.id, dispatchLeaseId: leaseId },
            data: { dispatchLeaseExpiresAt: new Date(Date.now() + 60000) },
          });
          if (!renewed.count) return;
          await this.db.broadcastDelivery.update({
            where: { id: delivery.id },
            data: { status: 'SENDING', attempts: { increment: 1 } },
          });
          try {
            const response = await fetch(this.endpoint, {
              method: 'POST',
              redirect: 'error',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.token}`,
                'Idempotency-Key': delivery.id,
              },
              body: JSON.stringify({
                recipientId: delivery.recipientId,
                recipientType: delivery.recipientType,
                title: label(broadcast.title),
                message: label(broadcast.body),
                category: broadcast.category,
              }),
              signal: AbortSignal.timeout(10000),
            });
            const receipt = (await response.json()) as { messageId?: unknown; status?: unknown };
            if (
              !response.ok ||
              typeof receipt.messageId !== 'string' ||
              receipt.status !== 'accepted'
            )
              throw new Error('Gateway did not confirm acceptance');
            await this.db.broadcastDelivery.update({
              where: { id: delivery.id },
              data: {
                status: 'SENT',
                providerId: receipt.messageId.slice(0, 200),
                sentAt: new Date(),
                failureReason: null,
              },
            });
          } catch {
            await this.db.broadcastDelivery.update({
              where: { id: delivery.id },
              data: {
                status: 'FAILED',
                failureReason: 'Delivery not confirmed; retry uses the same idempotency key',
              },
            });
          }
        }
        const failed = await this.db.broadcastDelivery.count({
          where: { announcementId: broadcast.id, status: { not: 'SENT' } },
        });
        await this.db.announcement.updateMany({
          where: { id: broadcast.id, dispatchLeaseId: leaseId },
          data: {
            dispatchLeaseId: null,
            dispatchLeaseExpiresAt: null,
            status: failed ? 'PARTIAL' : 'SENT',
            sentAt: failed ? null : new Date(),
            failureReason: failed ? `${failed} deliveries require retry` : null,
          },
        });
      } catch {
        await this.db.announcement.updateMany({
          where: { id: broadcast.id, dispatchLeaseId: leaseId },
          data: {
            dispatchLeaseId: null,
            dispatchLeaseExpiresAt: null,
            status: 'FAILED',
            failureReason:
              'Audience preparation or delivery failed. Review receipts before retrying.',
          },
        });
      }
    } finally {
      this.working = false;
    }
  }
  async templates(user: AuthStaffPayload) {
    requireGlobal(user);
    return this.db.notificationTemplate.findMany({ orderBy: { templateKey: 'asc' } });
  }
  async referrals(user: AuthStaffPayload) {
    requireGlobal(user);
    return this.db.referralCode.findMany({ orderBy: { createdAt: 'desc' } });
  }
  async saveTemplate(input: Prisma.NotificationTemplateCreateInput, user: AuthStaffPayload) {
    requireGlobal(user);
    return this.db.notificationTemplate.upsert({
      where: { templateKey: input.templateKey },
      create: input,
      update: input,
    });
  }
  async createReferral(input: Prisma.ReferralCodeCreateInput, user: AuthStaffPayload) {
    requireGlobal(user);
    const where = { id: input.ownerId, ...cityWhere(user) };
    if (input.ownerType === 'CUSTOMER')
      await this.db.customer.findFirstOrThrow({ where, select: { id: true } });
    else await this.db.companion.findFirstOrThrow({ where, select: { id: true } });
    return this.db.referralCode.create({ data: input });
  }
  async referralActive(id: string, active: boolean, user: AuthStaffPayload) {
    requireGlobal(user);
    return this.db.referralCode.update({ where: { id }, data: { active } });
  }
}
