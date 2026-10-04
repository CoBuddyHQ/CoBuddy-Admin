import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.module';
import { FraudFlagStatus, Prisma } from '@prisma/client';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import {
  ListFraudFlagsDto,
  UpdateFraudFlagDto,
  AddFraudActionDto,
  CreateFraudFlagDto,
} from './dto/fraud.dto';

@Injectable()
export class FraudDetectionService {
  constructor(private prisma: PrismaService) {}

  async list(dto: ListFraudFlagsDto) {
    const { page, pageSize, status, userType, category, userId } = dto;
    const skip = (page - 1) * pageSize;

    const where: Prisma.FraudFlagWhereInput = {};
    if (status) where.status = status as FraudFlagStatus;
    if (userType) where.userType = userType;
    if (category) where.category = category;
    if (userId) where.userId = userId;

    const [items, total] = await Promise.all([
      this.prisma.fraudFlag.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { riskScore: 'desc' },
      }),
      this.prisma.fraudFlag.count({ where }),
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

  async getOne(id: string) {
    const flag = await this.prisma.fraudFlag.findUnique({ where: { id } });
    if (!flag) throw new NotFoundException('Fraud flag not found');

    let userInfo: any = null;
    if (flag.userType === 'CUSTOMER') {
      userInfo = await this.prisma.customer.findUnique({
        where: { id: flag.userId },
        select: {
          id: true,
          name: true,
          phone: true,
          status: true,
          flagsCount: true,
          walletBalance: true,
        },
      });
    } else {
      userInfo = await this.prisma.companion.findUnique({
        where: { id: flag.userId },
        select: {
          id: true,
          name: true,
          phone: true,
          status: true,
          trustScore: true,
          totalEarnings: true,
        },
      });
    }

    const relatedFlags = await this.prisma.fraudFlag.findMany({
      where: { userId: flag.userId, id: { not: id } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return { data: { ...flag, user: userInfo, relatedFlags } };
  }

  async create(dto: CreateFraudFlagDto, user: AuthStaffPayload) {
    const flag = await this.prisma.fraudFlag.create({
      data: {
        userId: dto.userId,
        userType: dto.userType,
        category: dto.category,
        description: dto.description,
        riskScore: dto.riskScore,
        assignedToId: user.sub,
        status: FraudFlagStatus.OPEN,
      },
    });

    if (dto.userType === 'CUSTOMER') {
      await this.prisma.customer.update({
        where: { id: dto.userId },
        data: { flagsCount: { increment: 1 } },
      });
    }

    return { data: flag, message: 'Fraud flag created' };
  }

  async update(id: string, dto: UpdateFraudFlagDto, _user: AuthStaffPayload) {
    const flag = await this.prisma.fraudFlag.findUnique({ where: { id } });
    if (!flag) throw new NotFoundException('Fraud flag not found');

    const updated = await this.prisma.fraudFlag.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status as FraudFlagStatus }),
        ...(dto.assignedToId !== undefined && { assignedToId: dto.assignedToId }),
      },
    });
    return { data: updated, message: 'Fraud flag updated' };
  }

  async addAction(id: string, dto: AddFraudActionDto, user: AuthStaffPayload) {
    const flag = await this.prisma.fraudFlag.findUnique({ where: { id } });
    if (!flag) throw new NotFoundException('Fraud flag not found');

    const actionEntry = `[${user.name} @ ${new Date().toISOString()}]: ${dto.action}`;
    const updated = await this.prisma.fraudFlag.update({
      where: { id },
      data: { actionsTaken: { push: actionEntry } },
    });
    return { data: updated, message: 'Action recorded' };
  }

  async dashboard() {
    const [open, investigating, dismissed, actionTaken] = await Promise.all([
      this.prisma.fraudFlag.aggregate({
        where: { status: FraudFlagStatus.OPEN },
        _count: true,
        _avg: { riskScore: true },
      }),
      this.prisma.fraudFlag.aggregate({
        where: { status: FraudFlagStatus.INVESTIGATING },
        _count: true,
      }),
      this.prisma.fraudFlag.aggregate({
        where: { status: FraudFlagStatus.DISMISSED },
        _count: true,
      }),
      this.prisma.fraudFlag.aggregate({
        where: { status: FraudFlagStatus.ACTION_TAKEN },
        _count: true,
      }),
    ]);

    const byCategory = await this.prisma.fraudFlag.groupBy({
      by: ['category'],
      _count: true,
      _avg: { riskScore: true },
      orderBy: { _count: { category: 'desc' } },
    });

    const highRisk = await this.prisma.fraudFlag.findMany({
      where: {
        status: { in: [FraudFlagStatus.OPEN, FraudFlagStatus.INVESTIGATING] },
        riskScore: { gte: 70 },
      },
      orderBy: { riskScore: 'desc' },
      take: 10,
    });

    return {
      data: {
        summary: {
          open: open._count,
          investigating: investigating._count,
          dismissed: dismissed._count,
          actionTaken: actionTaken._count,
          avgOpenRisk: open._avg.riskScore ?? 0,
        },
        byCategory,
        highRiskFlags: highRisk,
      },
    };
  }
}
