import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.module';
import { CreateRuleDto, UpdateRuleDto } from './dto/trust-score.dto';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';

export interface TrustScoreRule {
  id: string;
  trigger: string;
  delta: number;
  category: string;
  description?: string;
  enabled: boolean;
  createdAt: Date;
}

let ruleStore: TrustScoreRule[] = [
  {
    id: 'r1',
    trigger: 'positive_review_5star',
    delta: 5,
    category: 'reviews',
    description: '5-star review received',
    enabled: true,
    createdAt: new Date(),
  },
  {
    id: 'r2',
    trigger: 'negative_review_1star',
    delta: -10,
    category: 'reviews',
    description: '1-star review received',
    enabled: true,
    createdAt: new Date(),
  },
  {
    id: 'r3',
    trigger: 'booking_no_show',
    delta: -15,
    category: 'bookings',
    description: 'No show on confirmed booking',
    enabled: true,
    createdAt: new Date(),
  },
  {
    id: 'r4',
    trigger: 'booking_completed',
    delta: 2,
    category: 'bookings',
    description: 'Booking completed successfully',
    enabled: true,
    createdAt: new Date(),
  },
  {
    id: 'r5',
    trigger: 'report_substantiated',
    delta: -20,
    category: 'safety',
    description: 'Report against user substantiated',
    enabled: true,
    createdAt: new Date(),
  },
];

@Injectable()
export class TrustScoreService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const companions = await this.prisma.companion.findMany({
      select: { id: true, name: true, trustScore: true, totalSessions: true },
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
        totalCompanions: companions.length,
        averageScore: companions.length
          ? Math.round(companions.reduce((s, c) => s + c.trustScore, 0) / companions.length)
          : 0,
        top10: companions.slice(0, 10),
        bottom10: sortedAsc.slice(0, 10),
      },
    };
  }

  async getRules() {
    return { data: ruleStore };
  }

  async createRule(dto: CreateRuleDto) {
    const newRule: TrustScoreRule = {
      id: `r${Date.now()}`,
      ...dto,
      enabled: true,
      createdAt: new Date(),
    };
    ruleStore.push(newRule);
    return { data: newRule, message: 'Rule created' };
  }

  async updateRule(id: string, dto: UpdateRuleDto) {
    const idx = ruleStore.findIndex((r) => r.id === id);
    if (idx === -1) throw new NotFoundException('Rule not found');
    ruleStore[idx] = { ...ruleStore[idx], ...dto };
    return { data: ruleStore[idx], message: 'Rule updated' };
  }

  async deleteRule(id: string) {
    const before = ruleStore.length;
    ruleStore = ruleStore.filter((r) => r.id !== id);
    if (ruleStore.length === before) throw new NotFoundException('Rule not found');
    return { message: 'Rule deleted' };
  }

  async recompute(companionId: string, _user: AuthStaffPayload) {
    const companion = await this.prisma.companion.findUnique({
      where: { id: companionId },
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

  async getHistory(companionId: string) {
    const companion = await this.prisma.companion.findUnique({ where: { id: companionId } });
    if (!companion) throw new NotFoundException('Companion not found');

    const history = await this.prisma.trustScoreHistoryEntry.findMany({
      where: { companionId },
      orderBy: { date: 'desc' },
    });
    return { data: history };
  }
}
