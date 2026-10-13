import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, FraudFlagStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '@/prisma/prisma.module';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { cityWhere, requireCity, requireGlobal, scopedCities } from '@/common/auth/city-scope';
import { label } from '@/common/utils/localized-label';
import {
  EventInput,
  LaunchInput,
  RankingInput,
  VenueInput,
} from '@/common/validation/workflow-inputs';

@Injectable()
export class CatalogService {
  constructor(private readonly db: PrismaService) {}

  async config(key: string, fallback: Prisma.InputJsonValue) {
    return (await this.db.appConfig.findUnique({ where: { configKey: key } }))?.value ?? fallback;
  }
  async saveConfig(key: string, value: Prisma.InputJsonValue, user: AuthStaffPayload) {
    requireGlobal(user);
    return this.db.appConfig.upsert({
      where: { configKey: key },
      create: { configKey: key, value },
      update: { value },
    });
  }
  async cities(user: AuthStaffPayload) {
    const ids = scopedCities(user);
    return this.db.city.findMany({
      where: ids ? { id: { in: ids } } : {},
      select: { id: true, name: true, state: true },
      orderBy: { cityCode: 'asc' },
    });
  }
  async events(user: AuthStaffPayload) {
    return (
      await this.db.specialEvent.findMany({
        where: cityWhere(user),
        orderBy: { startDate: 'desc' },
      })
    ).map((e) => ({
      ...e,
      title: label(e.title),
      description: label(e.description),
      imageUrl: e.bannerUrl,
      isActive: e.active,
    }));
  }
  async createEvent(input: EventInput, user: AuthStaffPayload) {
    requireCity(user, input.cityId);
    await this.db.city.findUniqueOrThrow({ where: { id: input.cityId } });
    return this.db.specialEvent.create({
      data: {
        cityId: input.cityId,
        title: { en: input.title },
        description: { en: input.description },
        bannerUrl: input.imageUrl ?? '',
        linkedCategory: input.linkedCategory,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
      },
    });
  }
  async eventActive(id: string, active: boolean, user: AuthStaffPayload) {
    const result = await this.db.specialEvent.updateMany({
      where: { id, ...cityWhere(user) },
      data: { active },
    });
    if (!result.count) throw new NotFoundException('Event not found');
    return { id, active };
  }
  async weights() {
    const row = await this.db.discoveryRankingConfig.findUnique({ where: { id: 'singleton' } });
    const weights = row ?? {
      trustScoreWeight: 0.35,
      ratingWeight: 0.25,
      responseTimeWeight: 0.15,
      acceptRateWeight: 0.1,
      sessionCompletionWeight: 0.1,
      proximityBonusWeight: 0.05,
      newCompanionBoostPercent: 20,
    };
    return {
      trustScoreWeight: weights.trustScoreWeight * 100,
      ratingWeight: weights.ratingWeight * 100,
      responseTimeWeight: weights.responseTimeWeight * 100,
      acceptRateWeight: weights.acceptRateWeight * 100,
      sessionCompletionWeight: weights.sessionCompletionWeight * 100,
      proximityBonusWeight: weights.proximityBonusWeight * 100,
      newCompanionBoostPercent: weights.newCompanionBoostPercent,
    };
  }
  async saveWeights(input: RankingInput, user: AuthStaffPayload) {
    requireGlobal(user);
    const data = {
      ...input,
      trustScoreWeight: input.trustScoreWeight / 100,
      ratingWeight: input.ratingWeight / 100,
      responseTimeWeight: input.responseTimeWeight / 100,
      acceptRateWeight: input.acceptRateWeight / 100,
      sessionCompletionWeight: input.sessionCompletionWeight / 100,
      proximityBonusWeight: input.proximityBonusWeight / 100,
    };
    await this.db.discoveryRankingConfig.upsert({
      where: { id: 'singleton' },
      create: data,
      update: data,
    });
    return input;
  }
  async promoted(user: AuthStaffPayload) {
    return (
      await this.db.companionPromotion.findMany({
        where: { companion: cityWhere(user) },
        include: { companion: { select: { name: true } } },
        orderBy: { promotedUntil: 'desc' },
      })
    ).map((p) => ({
      id: p.id,
      companionId: p.companionId,
      name: p.companion.name,
      promotedUntil: p.promotedUntil,
    }));
  }
  async promote(companionId: string, promotedUntil: string, user: AuthStaffPayload) {
    const companion = await this.db.companion.findFirst({
      where: {
        id: companionId,
        ...cityWhere(user),
        status: 'ACTIVE',
        verificationStatus: 'VERIFIED',
      },
      select: { id: true },
    });
    if (!companion)
      throw new BadRequestException('Choose an active, verified companion in your city scope');
    return this.db.companionPromotion.upsert({
      where: { companionId },
      create: { companionId, promotedUntil: new Date(promotedUntil) },
      update: { promotedUntil: new Date(promotedUntil) },
    });
  }
  async removePromotion(id: string, user: AuthStaffPayload) {
    const result = await this.db.companionPromotion.deleteMany({
      where: { id, companion: cityWhere(user) },
    });
    if (!result.count) throw new NotFoundException('Promotion not found');
    return { id };
  }
  async venues(user: AuthStaffPayload) {
    return (
      await this.db.venue.findMany({
        where: cityWhere(user),
        include: { city: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      })
    ).map((v) => ({
      id: v.id,
      name: v.nameI18n ?? { en: v.name },
      category: v.categoryI18n ?? { en: v.placeType },
      address: v.address,
      city: v.cityId,
      cityName: label(v.city.name),
      photoUrl: v.photoUrl ?? '',
      isActive: v.active,
      latitude: v.lat,
      longitude: v.lng,
    }));
  }
  async saveVenue(input: VenueInput, user: AuthStaffPayload, id?: string) {
    requireCity(user, input.city);
    await this.db.city.findUniqueOrThrow({ where: { id: input.city } });
    const data = {
      name: input.name.en,
      nameI18n: input.name,
      placeType: input.category.en,
      categoryI18n: input.category,
      address: input.address,
      cityId: input.city,
      photoUrl: input.photoUrl ?? '',
      lat: input.latitude,
      lng: input.longitude,
    };
    if (!id) return this.db.venue.create({ data });
    const result = await this.db.venue.updateMany({ where: { id, ...cityWhere(user) }, data });
    if (!result.count) throw new NotFoundException('Venue not found');
    return { id };
  }
  async venueActive(id: string, active: boolean, user: AuthStaffPayload) {
    const result = await this.db.venue.updateMany({
      where: { id, ...cityWhere(user) },
      data: { active },
    });
    if (!result.count) throw new NotFoundException('Venue not found');
    return { id, active };
  }
  async deleteVenue(id: string, user: AuthStaffPayload) {
    return this.db.$transaction(async (tx) => {
      const venue = await tx.venue.findFirst({ where: { id, ...cityWhere(user) } });
      if (!venue) throw new NotFoundException('Venue not found');
      if (await tx.booking.count({ where: { venueId: id } }))
        throw new ConflictException(
          'This venue has bookings. Deactivate it to preserve booking history.',
        );
      await tx.venue.delete({ where: { id } });
      return { id };
    });
  }
  async launches(user: AuthStaffPayload) {
    return (
      await this.db.cityLaunch.findMany({
        where: cityWhere(user),
        include: { city: true },
        orderBy: { targetLaunchDate: 'asc' },
      })
    ).map((l) => ({
      id: l.id,
      cityId: l.cityId,
      cityName: label(l.city.name),
      region: l.city.state,
      targetLaunchDate: l.targetLaunchDate,
      status: l.status,
      checklist: l.checklist,
      managerName: l.managerName,
    }));
  }
  async createLaunch(input: LaunchInput, user: AuthStaffPayload) {
    requireGlobal(user);
    return this.db.$transaction(async (tx) => {
      const existing = await tx.city.findFirst({
        where: { name: { path: ['en'], equals: input.cityName }, state: input.region },
      });
      const city =
        existing ??
        (await tx.city.create({
          data: {
            name: { en: input.cityName },
            state: input.region,
            cityCode: randomUUID(),
            active: false,
          },
        }));
      if (await tx.cityLaunch.count({ where: { cityId: city.id } }))
        throw new ConflictException('A launch already exists for this city');
      return tx.cityLaunch.create({
        data: {
          cityId: city.id,
          managerName: input.managerName,
          targetLaunchDate: new Date(input.targetLaunchDate),
          checklist: [
            { id: 'venues', task: 'Verify meeting venues', completed: false },
            { id: 'staff', task: 'Confirm support and safety coverage', completed: false },
            { id: 'companions', task: 'Verify companion readiness', completed: false },
          ],
        },
      });
    });
  }
  async launchStatus(id: string, status: string, user: AuthStaffPayload) {
    return this.db.$transaction(
      async (tx) => {
        const launch = await tx.cityLaunch.findFirst({ where: { id, ...cityWhere(user) } });
        if (!launch) throw new NotFoundException('City launch not found');
        const checklist = launch.checklist as { completed: boolean }[];
        if (
          ['READY', 'LIVE'].includes(status) &&
          (!checklist.length || checklist.some((t) => !t.completed))
        )
          throw new ConflictException('Complete the launch checklist first');
        if (
          status === 'LIVE' &&
          !(await tx.venue.count({ where: { cityId: launch.cityId, active: true } }))
        )
          throw new ConflictException('At least one active venue is required');
        await tx.city.update({ where: { id: launch.cityId }, data: { active: status === 'LIVE' } });
        return tx.cityLaunch.update({ where: { id }, data: { status } });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
  async checklist(id: string, taskId: string, completed: boolean, user: AuthStaffPayload) {
    return this.db.$transaction(
      async (tx) => {
        const launch = await tx.cityLaunch.findFirst({ where: { id, ...cityWhere(user) } });
        if (!launch) throw new NotFoundException('City launch not found');
        if (['READY', 'LIVE'].includes(launch.status))
          throw new ConflictException(
            'Return the launch to planning before changing its checklist',
          );
        const checklist = launch.checklist as { id: string; task: string; completed: boolean }[];
        if (!checklist.some((t) => t.id === taskId))
          throw new NotFoundException('Checklist task not found');
        return tx.cityLaunch.update({
          where: { id },
          data: { checklist: checklist.map((t) => (t.id === taskId ? { ...t, completed } : t)) },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
  async waitlist(user: AuthStaffPayload) {
    return (
      await this.db.waitlistEntry.findMany({
        where: cityWhere(user),
        include: { city: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      })
    ).map((e) => ({ ...e, city: label(e.city.name), signupDate: e.createdAt }));
  }
  async addWaitlist(
    input: { email: string; phone: string; cityId: string },
    user: AuthStaffPayload,
  ) {
    requireCity(user, input.cityId);
    return this.db.waitlistEntry.create({ data: input });
  }
  async approveWaitlist(id: string, user: AuthStaffPayload) {
    return this.db.$transaction(
      async (tx) => {
        const entry = await tx.waitlistEntry.findFirst({ where: { id, ...cityWhere(user) } });
        if (!entry) throw new NotFoundException('Waitlist entry not found');
        if (entry.status !== 'PENDING')
          throw new ConflictException('Only pending entries can be approved');
        const config = await tx.appConfig.findUnique({
          where: { configKey: 'operations.waitlist' },
        });
        const max = (config?.value as { maxDailyInvites?: number } | null)?.maxDailyInvites ?? 100;
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        if ((await tx.waitlistEntry.count({ where: { approvedAt: { gte: today } } })) >= max)
          throw new ConflictException('Daily approval limit reached');
        return tx.waitlistEntry.update({
          where: { id },
          data: { status: 'APPROVED', approvedAt: new Date(), approvedById: user.sub },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
  private async abuseWhere(user: AuthStaffPayload): Promise<Prisma.FraudFlagWhereInput> {
    const categories = { category: { in: ['REFERRAL_FARMING', 'BOT_SIGNUP', 'MASS_ONBOARDING'] } };
    if (!scopedCities(user)) return categories;
    const [customers, companions] = await Promise.all([
      this.db.customer.findMany({ where: cityWhere(user), select: { id: true } }),
      this.db.companion.findMany({ where: cityWhere(user), select: { id: true } }),
    ]);
    return {
      ...categories,
      OR: [
        { userType: 'CUSTOMER', userId: { in: customers.map((c) => c.id) } },
        { userType: 'COMPANION', userId: { in: companions.map((c) => c.id) } },
      ],
    };
  }
  async abuse(user: AuthStaffPayload) {
    return (
      await this.db.fraudFlag.findMany({
        where: await this.abuseWhere(user),
        orderBy: { createdAt: 'desc' },
      })
    ).map((f) => ({
      id: f.id,
      type: f.category,
      severity:
        f.riskScore >= 90
          ? 'CRITICAL'
          : f.riskScore >= 70
            ? 'HIGH'
            : f.riskScore >= 40
              ? 'MEDIUM'
              : 'LOW',
      targetId: f.userId,
      targetName: f.userId,
      details: f.description,
      timestamp: f.createdAt,
      status:
        f.status === 'DISMISSED' ? 'RESOLVED' : f.status === 'ACTION_TAKEN' ? 'ACTIONED' : f.status,
    }));
  }
  async abuseStatus(id: string, status: string, user: AuthStaffPayload) {
    const result = await this.db.fraudFlag.updateMany({
      where: { id, ...(await this.abuseWhere(user)), status: { not: 'ACTION_TAKEN' } },
      data: { status: (status === 'RESOLVED' ? 'DISMISSED' : status) as FraudFlagStatus },
    });
    if (!result.count) throw new ConflictException('Flag is unavailable or already actioned');
    return { id, status };
  }
  async abuseAction(id: string, action: string, user: AuthStaffPayload) {
    const where = await this.abuseWhere(user);
    return this.db.$transaction(
      async (tx) => {
        const flag = await tx.fraudFlag.findFirst({ where: { id, ...where } });
        if (!flag) throw new NotFoundException('Abuse flag not found');
        if (!['OPEN', 'INVESTIGATING'].includes(flag.status))
          throw new ConflictException('This flag is already resolved');
        if (action === 'BLOCK_REFERRAL') {
          const changed = await tx.referralCode.updateMany({
            where: { ownerId: flag.userId, ownerType: flag.userType, active: true },
            data: { active: false },
          });
          if (!changed.count)
            throw new ConflictException('No active referral code exists for this account');
        } else if (flag.userType === 'CUSTOMER') {
          await tx.customer.update({ where: { id: flag.userId }, data: { status: 'BANNED' } });
        } else if (flag.userType === 'COMPANION') {
          await tx.companion.update({ where: { id: flag.userId }, data: { status: 'BANNED' } });
        } else throw new BadRequestException('Unsupported account type');
        return tx.fraudFlag.update({
          where: { id },
          data: { status: 'ACTION_TAKEN', actionsTaken: { push: `${action}:${user.sub}` } },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
