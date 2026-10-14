import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.module';
import { ReviewModerationStatus, AppealStatus, BanDuration } from '@prisma/client';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import {
  ListReportsDto,
  AssignReportDto,
  UpdateReportStatusDto,
  BanUserFromReportDto,
  IssueWarningDto,
} from './dto/reports.dto';
import { CreateBanDto, LiftBanDto, ListBansDto } from './dto/bans.dto';
import { ListFlaggedChatsDto, DecideFlaggedChatDto } from './dto/flagged-chats.dto';
import { ListRiskScoresDto, UpdateRiskConfigDto } from './dto/risk-scoring.dto';
import { ListReviewsDto, RemoveReviewDto } from './dto/reviews.dto';
import { ListAppealsDto, UpdateAppealStatusDto, AddAppealNoteDto } from './dto/appeals.dto';
import { UpdateChatSettingsDto } from './dto/chat-settings.dto';
import { addDuration } from '@/lib/date-util';
import { cityWhere, scopedCities } from '@/common/auth/city-scope';

const CHAT_SETTINGS_PREFIX = 'chat_settings.';
const RISK_CONFIG_PREFIX = 'risk_config.';

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  private async ownerScope(user: AuthStaffPayload) {
    const cities = scopedCities(user);
    if (cities === undefined) return {};
    const [customers, companions] = await Promise.all([
      this.prisma.customer.findMany({ where: cityWhere(user), select: { id: true } }),
      this.prisma.companion.findMany({ where: cityWhere(user), select: { id: true } }),
    ]);
    return {
      OR: [
        { userType: 'CUSTOMER', userId: { in: customers.map(({ id }) => id) } },
        { userType: 'COMPANION', userId: { in: companions.map(({ id }) => id) } },
      ],
    };
  }

  private async reportScope(user: AuthStaffPayload) {
    const scope = await this.ownerScope(user);
    return scope.OR
      ? {
          OR: scope.OR.map(({ userType, userId }) => ({
            reportedUserType: userType,
            reportedUserId: userId,
          })),
        }
      : {};
  }

  private reviewScope(user: AuthStaffPayload) {
    return scopedCities(user) === undefined
      ? {}
      : { OR: [{ toCompanion: cityWhere(user) }, { toCustomer: cityWhere(user) }] };
  }

  private async appealScope(user: AuthStaffPayload) {
    if (scopedCities(user) === undefined) return {};
    const bans = await this.prisma.userBan.findMany({
      where: await this.ownerScope(user),
      select: { id: true },
    });
    return { banId: { in: bans.map(({ id }) => id) } };
  }

  async listReports(dto: ListReportsDto, user: AuthStaffPayload) {
    const { page, pageSize, status, category, assignedToId } = dto;
    const skip = (page - 1) * pageSize;
    const where: any = await this.reportScope(user);
    if (status) where.status = status;
    if (category) where.categoryCode = category;
    if (assignedToId) where.assignedToId = assignedToId;

    const [items, total] = await Promise.all([
      this.prisma.userReport.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { assignedTo: { select: { id: true, name: true } } },
      }),
      this.prisma.userReport.count({ where }),
    ]);
    return {
      data: items,
      meta: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page < Math.ceil(total / pageSize),
        hasPrevious: page > 1,
      },
    };
  }

  async getReport(id: string, user: AuthStaffPayload) {
    const report = await this.prisma.userReport.findFirst({
      where: { id, ...(await this.reportScope(user)) },
      include: { assignedTo: { select: { id: true, name: true } } },
    });
    if (!report) throw new NotFoundException('Report not found');
    return { data: report };
  }

  async assignReport(
    id: string,
    dto: AssignReportDto | null,
    user: AuthStaffPayload,
    assignSelf: boolean,
  ) {
    const report = await this.prisma.userReport.findFirst({
      where: { id, ...(await this.reportScope(user)) },
    });
    if (!report) throw new NotFoundException('Report not found');

    const staffId = assignSelf ? user.sub : dto?.staffId;
    if (!staffId) throw new BadRequestException('staffId is required unless using assign-me');

    if (staffId && !assignSelf) {
      const staff = await this.prisma.staffEmployee.findUnique({ where: { id: staffId } });
      if (!staff) throw new NotFoundException('Staff not found');
    }

    const updated = await this.prisma.userReport.update({
      where: { id },
      data: { assignedToId: staffId },
    });
    return { data: updated, message: 'Report assigned' };
  }

  async updateReportStatus(id: string, dto: UpdateReportStatusDto, user: AuthStaffPayload) {
    const report = await this.prisma.userReport.findFirst({
      where: { id, ...(await this.reportScope(user)) },
    });
    if (!report) throw new NotFoundException('Report not found');

    const existingNotes: any[] = Array.isArray(report.notes as any) ? (report.notes as any[]) : [];
    if (dto.note) {
      existingNotes.push({
        by: user.name,
        byId: user.sub,
        note: dto.note,
        at: new Date().toISOString(),
      });
    }

    const updated = await this.prisma.userReport.update({
      where: { id },
      data: { status: dto.status, notes: existingNotes as any },
    });
    return { data: updated, message: 'Report status updated' };
  }

  async banUserFromReport(id: string, dto: BanUserFromReportDto, user: AuthStaffPayload) {
    const report = await this.prisma.userReport.findFirst({
      where: { id, ...(await this.reportScope(user)) },
    });
    if (!report) throw new NotFoundException('Report not found');

    const durationEnum = dto.duration as unknown as BanDuration;
    let endsAt: Date | null = null;
    if (dto.duration === 'TEMPORARY_24H') endsAt = addDuration('24h');
    else if (dto.duration === 'TEMPORARY_7D') endsAt = addDuration('7d');
    else if (dto.duration === 'TEMPORARY_30D') endsAt = addDuration('30d');

    const ban = await this.prisma.userBan.create({
      data: {
        userId: report.reportedUserId,
        userType: report.reportedUserType,
        reason: dto.reason,
        reportId: id,
        duration: durationEnum,
        endsAt,
        bannedById: user.sub,
      },
    });

    const userUpdate: any = { status: 'BANNED' };
    if (report.reportedUserType === 'CUSTOMER') {
      await this.prisma.customer.update({ where: { id: report.reportedUserId }, data: userUpdate });
    } else if (report.reportedUserType === 'COMPANION') {
      await this.prisma.companion.update({
        where: { id: report.reportedUserId },
        data: userUpdate,
      });
    }

    return { data: ban, message: 'User banned' };
  }

  async issueWarning(id: string, dto: IssueWarningDto, user: AuthStaffPayload) {
    const report = await this.prisma.userReport.findFirst({
      where: { id, ...(await this.reportScope(user)) },
    });
    if (!report) throw new NotFoundException('Report not found');

    const notif = await this.prisma.staffNotification.create({
      data: {
        staffId: report.assignedToId || user.sub,
        title: 'Warning Issued',
        body: dto.message,
        type: 'MODERATION_WARNING',
        relatedId: id,
        relatedType: 'UserReport',
      },
    });
    return { data: notif, message: 'Warning issued' };
  }

  async listBans(dto: ListBansDto, user: AuthStaffPayload) {
    const { page, pageSize, userId, userType } = dto;
    const skip = (page - 1) * pageSize;
    const where: any = await this.ownerScope(user);
    if (userId) where.userId = userId;
    if (userType) where.userType = userType;

    const [items, total] = await Promise.all([
      this.prisma.userBan.findMany({ where, skip, take: pageSize, orderBy: { startsAt: 'desc' } }),
      this.prisma.userBan.count({ where }),
    ]);
    return {
      data: items,
      meta: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page < Math.ceil(total / pageSize),
        hasPrevious: page > 1,
      },
    };
  }

  async createBan(dto: CreateBanDto, user: AuthStaffPayload) {
    if (scopedCities(user) !== undefined) {
      const query = { where: { id: dto.userId, ...cityWhere(user) }, select: { id: true } };
      const account =
        dto.userType === 'CUSTOMER'
          ? await this.prisma.customer.findFirst(query)
          : await this.prisma.companion.findFirst(query);
      if (!account) throw new NotFoundException('Account not found');
    }
    const durationEnum = dto.duration as unknown as BanDuration;
    let endsAt: Date | null = null;
    if (dto.duration === 'TEMPORARY_24H') endsAt = addDuration('24h');
    else if (dto.duration === 'TEMPORARY_7D') endsAt = addDuration('7d');
    else if (dto.duration === 'TEMPORARY_30D') endsAt = addDuration('30d');

    const ban = await this.prisma.userBan.create({
      data: {
        userId: dto.userId,
        userType: dto.userType,
        reason: dto.reason,
        reportId: dto.reportId,
        duration: durationEnum,
        endsAt,
        bannedById: user.sub,
      },
    });

    const userUpdate: any = { status: 'BANNED' };
    if (dto.userType === 'CUSTOMER') {
      await this.prisma.customer.update({ where: { id: dto.userId }, data: userUpdate });
    } else if (dto.userType === 'COMPANION') {
      await this.prisma.companion.update({ where: { id: dto.userId }, data: userUpdate });
    }

    return { data: ban, message: 'Ban created' };
  }

  async liftBan(id: string, dto: LiftBanDto, user: AuthStaffPayload) {
    const ban = await this.prisma.userBan.findFirst({
      where: { id, ...(await this.ownerScope(user)) },
    });
    if (!ban) throw new NotFoundException('Ban not found');

    const updated = await this.prisma.userBan.update({
      where: { id },
      data: { liftedAt: new Date(), liftedById: user.sub, liftReason: dto.reason },
    });

    const userUpdate: any = { status: 'ACTIVE' };
    if (ban.userType === 'CUSTOMER') {
      await this.prisma.customer.update({ where: { id: ban.userId }, data: userUpdate });
    } else if (ban.userType === 'COMPANION') {
      await this.prisma.companion.update({ where: { id: ban.userId }, data: userUpdate });
    }

    return { data: updated, message: 'Ban lifted' };
  }

  async getBanAppeals(banId: string, user: AuthStaffPayload) {
    const ban = await this.prisma.userBan.findFirst({
      where: { id: banId, ...(await this.ownerScope(user)) },
    });
    if (!ban) throw new NotFoundException('Ban not found');
    const appeals = await this.prisma.userBanAppeal.findMany({
      where: { banId },
      orderBy: { createdAt: 'desc' },
    });
    return { data: appeals };
  }

  async listFlaggedChats(_dto: ListFlaggedChatsDto): Promise<never> {
    throw new ServiceUnavailableException(
      'Flagged chat storage is not configured. No moderation data is available.',
    );
  }

  async getFlaggedChat(_chatId: string): Promise<never> {
    throw new ServiceUnavailableException(
      'Flagged chat storage is not configured. No transcript is available.',
    );
  }

  async decideFlaggedChat(
    _chatId: string,
    _dto: DecideFlaggedChatDto,
    _user: AuthStaffPayload,
  ): Promise<never> {
    throw new ServiceUnavailableException(
      'Flagged chat storage is not configured. No decision was saved.',
    );
  }

  private async getAppConfig(prefix: string): Promise<Record<string, any>> {
    const rows = await this.prisma.appConfig.findMany({
      where: { configKey: { startsWith: prefix } },
    });
    const result: Record<string, any> = {};
    rows.forEach((r) => {
      const key = r.configKey.slice(prefix.length);
      result[key] = r.value;
    });
    return result;
  }

  private async setAppConfig(prefix: string, values: Record<string, any>) {
    const entries = Object.entries(values);
    for (const [k, v] of entries) {
      const fullKey = `${prefix}${k}`;
      await this.prisma.appConfig.upsert({
        where: { configKey: fullKey },
        update: { value: v as any, description: `Moderation setting: ${k}` },
        create: { configKey: fullKey, value: v as any, description: `Moderation setting: ${k}` },
      });
    }
  }

  async getChatSettings() {
    const settings = await this.getAppConfig(CHAT_SETTINGS_PREFIX);
    const defaults = {
      enableProfanityFilter: true,
      profanitySeverityThreshold: 70,
      enableLinkWhitelist: true,
      enableAutoFlagging: true,
      maxMessageLength: 2000,
      allowedMediaTypes: 'image/*,video/*',
    };
    return { data: { ...defaults, ...settings } };
  }

  async updateChatSettings(dto: UpdateChatSettingsDto) {
    await this.setAppConfig(CHAT_SETTINGS_PREFIX, dto as Record<string, any>);
    return this.getChatSettings().then((r) => ({ ...r, message: 'Chat settings updated' }));
  }

  async listRiskScores(dto: ListRiskScoresDto, user: AuthStaffPayload) {
    const { page, pageSize, userType } = dto;
    const skip = (page - 1) * pageSize;

    const whereFlag: any = await this.ownerScope(user);
    if (userType) whereFlag.userType = userType;

    const flags = await this.prisma.fraudFlag.findMany({
      where: whereFlag,
      skip,
      take: pageSize,
      orderBy: { riskScore: 'desc' },
    });

    const total = await this.prisma.fraudFlag.count({ where: whereFlag });
    return {
      data: flags,
      meta: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page < Math.ceil(total / pageSize),
        hasPrevious: page > 1,
      },
    };
  }

  async reclassifyRiskScore(
    userId: string,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    user: AuthStaffPayload,
  ) {
    const scoreByLevel = { LOW: 20, MEDIUM: 45, HIGH: 65, CRITICAL: 85 };
    const result = await this.prisma.fraudFlag.updateMany({
      where: { userId, ...(await this.ownerScope(user)) },
      data: { riskScore: scoreByLevel[riskLevel] },
    });
    if (result.count === 0) throw new NotFoundException('No risk flags found for user');
    return {
      data: { userId, riskLevel, updatedFlags: result.count },
      message: 'Risk score reclassified',
    };
  }

  async getRiskScoreBreakdown(userId: string, user: AuthStaffPayload) {
    const flags = await this.prisma.fraudFlag.findMany({
      where: { userId, ...(await this.ownerScope(user)) },
      orderBy: { createdAt: 'desc' },
    });

    const categories = flags.reduce(
      (acc: Record<string, { count: number; totalRisk: number }>, f) => {
        if (!acc[f.category]) acc[f.category] = { count: 0, totalRisk: 0 };
        acc[f.category].count++;
        acc[f.category].totalRisk += f.riskScore;
        return acc;
      },
      {},
    );

    const total = flags.reduce((s, f) => s + f.riskScore, 0);
    const avg = flags.length ? total / flags.length : 0;

    let userInfo: any = null;
    const customer = await this.prisma.customer.findFirst({
      where: { id: userId, ...cityWhere(user) },
      select: { id: true, name: true, status: true, flagsCount: true },
    });
    if (customer) userInfo = { ...customer, userType: 'CUSTOMER' };
    if (!userInfo) {
      const companion = await this.prisma.companion.findFirst({
        where: { id: userId, ...cityWhere(user) },
        select: { id: true, name: true, status: true, trustScore: true },
      });
      if (companion) userInfo = { ...companion, userType: 'COMPANION' };
    }

    if (!userInfo && scopedCities(user) !== undefined)
      throw new NotFoundException('Account not found');
    return {
      data: {
        user: userInfo,
        overallRisk: avg,
        flagsCount: flags.length,
        flags,
        breakdown: categories,
      },
    };
  }

  async getRiskConfig() {
    const config = await this.getAppConfig(RISK_CONFIG_PREFIX);
    const defaults = {
      minRiskScoreForReview: 50,
      autoSuspendThreshold: 80,
      enableAutoFlags: true,
      categoryWeights: {
        payment_fraud: 1.5,
        identity_theft: 2.0,
        abuse: 1.2,
        policy_violation: 1.0,
      },
    };
    return { data: { ...defaults, ...config } };
  }

  async updateRiskConfig(dto: UpdateRiskConfigDto) {
    await this.setAppConfig(RISK_CONFIG_PREFIX, dto as Record<string, any>);
    return this.getRiskConfig().then((r) => ({ ...r, message: 'Risk scoring config updated' }));
  }

  async listReviews(dto: ListReviewsDto, user: AuthStaffPayload) {
    const { page, pageSize, status, rating, tagCodes } = dto;
    const skip = (page - 1) * pageSize;
    const where: any = this.reviewScope(user);
    if (status) where.moderationStatus = status;
    if (rating) where.rating = rating;
    if (tagCodes && tagCodes.length) where.tagCodes = { hasEvery: tagCodes };

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          byCustomer: { select: { id: true, name: true } },
          toCompanion: { select: { id: true, name: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);
    return {
      data: items,
      meta: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page < Math.ceil(total / pageSize),
        hasPrevious: page > 1,
      },
    };
  }

  async approveReview(id: string, user: AuthStaffPayload) {
    const review = await this.prisma.review.findFirst({ where: { id, ...this.reviewScope(user) } });
    if (!review) throw new NotFoundException('Review not found');
    const updated = await this.prisma.review.update({
      where: { id },
      data: { moderationStatus: ReviewModerationStatus.APPROVED, moderatedById: user.sub },
    });
    return { data: updated, message: 'Review approved' };
  }

  async removeReview(id: string, dto: RemoveReviewDto, user: AuthStaffPayload) {
    const review = await this.prisma.review.findFirst({ where: { id, ...this.reviewScope(user) } });
    if (!review) throw new NotFoundException('Review not found');
    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        moderationStatus: ReviewModerationStatus.REMOVED,
        moderationNote: dto.reason,
        moderatedById: user.sub,
      },
    });
    return { data: updated, message: 'Review removed' };
  }

  async flagReview(id: string, user: AuthStaffPayload) {
    const review = await this.prisma.review.findFirst({ where: { id, ...this.reviewScope(user) } });
    if (!review) throw new NotFoundException('Review not found');
    const updated = await this.prisma.review.update({
      where: { id },
      data: { moderationStatus: ReviewModerationStatus.FLAGGED, moderatedById: user.sub },
    });
    return { data: updated, message: 'Review flagged' };
  }

  async listAppeals(dto: ListAppealsDto, user: AuthStaffPayload) {
    const { page, pageSize, status } = dto;
    const skip = (page - 1) * pageSize;
    const where: any = await this.appealScope(user);
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.userBanAppeal.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.userBanAppeal.count({ where }),
    ]);
    return {
      data: items,
      meta: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page < Math.ceil(total / pageSize),
        hasPrevious: page > 1,
      },
    };
  }

  async getAppeal(id: string, user: AuthStaffPayload) {
    const appeal = await this.prisma.userBanAppeal.findFirst({
      where: { id, ...(await this.appealScope(user)) },
    });
    if (!appeal) throw new NotFoundException('Appeal not found');
    const ban = await this.prisma.userBan.findUnique({ where: { id: appeal.banId } });
    return { data: { ...appeal, ban } };
  }

  async updateAppealStatus(id: string, dto: UpdateAppealStatusDto, user: AuthStaffPayload) {
    const appeal = await this.prisma.userBanAppeal.findFirst({
      where: { id, ...(await this.appealScope(user)) },
    });
    if (!appeal) throw new NotFoundException('Appeal not found');

    const updated = await this.prisma.$transaction(async (tx: any) => {
      const result = await tx.userBanAppeal.update({
        where: { id },
        data: {
          status: dto.status,
          reviewerId: user.sub,
          reviewNote: dto.reviewNote,
          reviewedAt: new Date(),
        },
      });

      if (dto.status === AppealStatus.APPROVED) {
        await tx.userBan.update({
          where: { id: appeal.banId },
          data: {
            liftedAt: new Date(),
            liftedById: user.sub,
            liftReason: `Appeal approved: ${dto.reviewNote || 'No note'}`,
          },
        });

        const ban = await tx.userBan.findUnique({ where: { id: appeal.banId } });
        if (ban) {
          const userUpdate: any = { status: 'ACTIVE' };
          if (ban.userType === 'CUSTOMER') {
            await tx.customer.update({ where: { id: ban.userId }, data: userUpdate });
          } else if (ban.userType === 'COMPANION') {
            await tx.companion.update({ where: { id: ban.userId }, data: userUpdate });
          }
        }
      }

      return result;
    });

    return { data: updated, message: 'Appeal status updated' };
  }

  async addAppealNote(id: string, dto: AddAppealNoteDto, user: AuthStaffPayload) {
    const appeal = await this.prisma.userBanAppeal.findFirst({
      where: { id, ...(await this.appealScope(user)) },
    });
    if (!appeal) throw new NotFoundException('Appeal not found');

    const existing = appeal.reviewNote
      ? `${appeal.reviewNote}\n\n[${user.name} ${new Date().toISOString()}]: ${dto.note}`
      : `[${user.name} ${new Date().toISOString()}]: ${dto.note}`;

    const updated = await this.prisma.userBanAppeal.update({
      where: { id },
      data: { reviewNote: existing },
    });
    return { data: updated, message: 'Note added to appeal' };
  }
}
