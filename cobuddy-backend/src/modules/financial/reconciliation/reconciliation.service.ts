import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.module';
import { ReconciliationMatchStatus, Prisma } from '@prisma/client';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { ListReconciliationDto, ResolveReconciliationDto } from './dto/reconciliation.dto';

@Injectable()
export class ReconciliationService {
  constructor(private prisma: PrismaService) {}

  async list(dto: ListReconciliationDto) {
    const { page, pageSize, matchStatus, gateway, from, to } = dto;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ReconciliationRecordWhereInput = {};
    if (matchStatus) where.matchStatus = matchStatus as ReconciliationMatchStatus;
    if (gateway) where.gateway = gateway;
    if (from || to) {
      where.reconciliationDate = {};
      if (from) (where.reconciliationDate as any).gte = new Date(from);
      if (to) (where.reconciliationDate as any).lte = new Date(to);
    }

    const [items, total] = await Promise.all([
      this.prisma.reconciliationRecord.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { reconciliationDate: 'desc' },
      }),
      this.prisma.reconciliationRecord.count({ where }),
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
    const record = await this.prisma.reconciliationRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Reconciliation record not found');

    let internalTxn: any = null;
    if (record.internalTxnId) {
      internalTxn = await this.prisma.walletTransaction.findUnique({
        where: { id: record.internalTxnId },
      });
    }

    return { data: { ...record, internalTxn } };
  }

  async resolve(id: string, dto: ResolveReconciliationDto, _user: AuthStaffPayload) {
    const record = await this.prisma.reconciliationRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Reconciliation record not found');

    const updated = await this.prisma.reconciliationRecord.update({
      where: { id },
      data: {
        matchStatus: dto.matchStatus as ReconciliationMatchStatus,
        mismatchNote: dto.mismatchNote ?? record.mismatchNote,
      },
    });
    return { data: updated, message: 'Reconciliation record resolved' };
  }

  async summary() {
    const [matched, mismatched, pending] = await Promise.all([
      this.prisma.reconciliationRecord.count({
        where: { matchStatus: ReconciliationMatchStatus.MATCHED },
      }),
      this.prisma.reconciliationRecord.count({
        where: { matchStatus: ReconciliationMatchStatus.MISMATCHED },
      }),
      this.prisma.reconciliationRecord.count({
        where: { matchStatus: ReconciliationMatchStatus.PENDING },
      }),
    ]);

    const mismatchedRecords = await this.prisma.reconciliationRecord.findMany({
      where: { matchStatus: ReconciliationMatchStatus.MISMATCHED },
      orderBy: { reconciliationDate: 'desc' },
      take: 5,
    });

    return {
      data: {
        matched,
        mismatched,
        pending,
        total: matched + mismatched + pending,
        recentMismatches: mismatchedRecords,
      },
    };
  }
}
