import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AppConfig, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.module';
import { CreateRuleDto, UpdateRuleDto } from './dto/trust-score.dto';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { cityWhere } from '@/common/auth/city-scope';

export interface TrustScoreRule {
  id: string;
  trigger: string;
  delta: number;
  category: string;
  description?: string;
  enabled: boolean;
  createdAt: string;
}

const RULE_PREFIX = 'trust-score.rule.';

@Injectable()
export class TrustScoreService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(user: AuthStaffPayload) {
    const companions = await this.prisma.companion.findMany({
      where: cityWhere(user),
      select: { id: true, name: true, trustScore: true, totalSessions: true, updatedAt: true },
      orderBy: { trustScore: 'desc' },
    });

    const buckets = [
      { range: '0-20', count: 0 },
      { range: '21-40', count: 0 },
      { range: '41-60', count: 0 },
      { range: '61-80', count: 0 },
      { range: '81-100', count: 0 },
    ];

    companions.forEach((c) => {
      const ts = c.trustScore;
      if (ts <= 20) buckets[0].count++;
      else if (ts <= 40) buckets[1].count++;
      else if (ts <= 60) buckets[2].count++;
      else if (ts <= 80) buckets[3].count++;
      else buckets[4].count++;
    });

    const sortedAsc = [...companions].sort((a, b) => a.trustScore - b.trustScore);

    return {
      data: {
        histogram: buckets,
        companions,
        totalCompanions: companions.length,
        averageScore: companions.length
          ? Math.round(companions.reduce((s, c) => s + c.trustScore, 0) / companions.length)
          : 0,
        top10: companions.slice(0, 10),
        bottom10: sortedAsc.slice(0, 10),
      },
    };
  }

  private mapRule(record: AppConfig): TrustScoreRule {
    return { ...(record.value as unknown as Omit<TrustScoreRule, 'id'>), id: record.id };
  }

  async getRules() {
    const records = await this.prisma.appConfig.findMany({
      where: { configKey: { startsWith: RULE_PREFIX } },
      orderBy: { updatedAt: 'asc' },
    });
    return { data: records.map((record) => this.mapRule(record)) };
  }

  async createRule(dto: CreateRuleDto) {
    const id = randomUUID();
    const record = await this.prisma.appConfig.create({
      data: {
        id,
        configKey: RULE_PREFIX + id,
        value: { ...dto, enabled: true, createdAt: new Date().toISOString() },
        description: 'Trust score rule',
      },
    });
    return { data: this.mapRule(record), message: 'Rule created' };
  }

  async updateRule(id: string, dto: UpdateRuleDto) {
    const record = await this.prisma.appConfig.findFirst({
      where: { id, configKey: { startsWith: RULE_PREFIX } },
    });
    if (!record) throw new NotFoundException('Rule not found');
    const changes = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );
    const value = { ...(record.value as Prisma.JsonObject), ...changes } as Prisma.InputJsonObject;
    const result = await this.prisma.appConfig.updateMany({
      where: { id, updatedAt: record.updatedAt, configKey: { startsWith: RULE_PREFIX } },
      data: { value },
    });
    if (result.count !== 1) throw new ConflictException('Rule changed. Refresh and try again.');
    return {
      data: this.mapRule({ ...record, value: value as Prisma.JsonObject }),
      message: 'Rule updated',
    };
  }

  async deleteRule(id: string) {
    const result = await this.prisma.appConfig.deleteMany({
      where: { id, configKey: { startsWith: RULE_PREFIX } },
    });
    if (!result.count) throw new NotFoundException('Rule not found');
    return { message: 'Rule deleted' };
  }

  async recompute(companionId: string, user: AuthStaffPayload) {
    const companion = await this.prisma.companion.findFirst({
      where: { id: companionId, ...cityWhere(user) },
      include: { trustScoreHistory: { orderBy: { date: 'desc' }, take: 1 } },
    });
    if (!companion) throw new NotFoundException('Companion not found');

    const oldScore = companion.trustScore;
    const bookingsDelta = Math.min(companion.totalSessions * 0.5, 20);
    let newScore = 50 + bookingsDelta;

    const reviewsAvg = await this.prisma.review.aggregate({
      where: { toCompanionId: companionId, moderationStatus: { not: 'REMOVED' } },
      _avg: { rating: true },
      _count: true,
    });
    if (reviewsAvg._avg.rating) {
      newScore += (reviewsAvg._avg.rating - 3) * 5;
    }

    const flags = await this.prisma.fraudFlag.count({
      where: { userId: companionId, userType: 'COMPANION', status: 'ACTION_TAKEN' },
    });
    newScore -= flags * 15;

    const reports = await this.prisma.userReport.count({
      where: { reportedUserId: companionId, reportedUserType: 'COMPANION', status: 'RESOLVED' },
    });
    newScore -= reports * 10;

    newScore = Math.max(0, Math.min(100, Math.round(newScore)));

    await this.prisma.$transaction(async (tx) => {
      await tx.companion.update({
        where: { id: companionId },
        data: { trustScore: newScore },
      });
      await tx.trustScoreHistoryEntry.create({
        data: {
          companionId,
          oldScore,
          newScore,
          reason: 'Manual recompute by admin',
          reasonCategory: 'admin_recompute',
        },
      });
    });

    return { data: { companionId, oldScore, newScore }, message: 'Trust score recomputed' };
  }

  async getHistory(companionId: string, user: AuthStaffPayload) {
    const companion = await this.prisma.companion.findFirst({
      where: { id: companionId, ...cityWhere(user) },
    });
    if (!companion) throw new NotFoundException('Companion not found');

    const history = await this.prisma.trustScoreHistoryEntry.findMany({
      where: { companionId },
      orderBy: { date: 'desc' },
    });
    return { data: history };
  }
}
