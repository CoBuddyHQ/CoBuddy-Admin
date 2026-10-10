import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.module';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(q: AuditLogQueryDto) {
    const where: Prisma.AuditLogWhereInput = {};
    if (q.adminId) where.adminId = q.adminId;
    if (q.moduleAffected) where.moduleAffected = q.moduleAffected;
    if (q.action) where.action = q.action;
    if (q.resourceType) where.resourceType = q.resourceType;
    if (q.resourceId) where.resourceId = q.resourceId;
    if (q.from || q.to) {
      where.timestamp = {};
      if (q.from) where.timestamp.gte = q.from;
      if (q.to) where.timestamp.lte = q.to;
    }
    const [totalItems, list] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { timestamp: 'desc' },
      }),
    ]);
    const totalPages = Math.ceil(totalItems / q.pageSize);
    return {
      data: list,
      meta: {
        page: q.page,
        pageSize: q.pageSize,
        totalItems,
        totalPages,
        hasNext: q.page < totalPages,
        hasPrevious: q.page > 1,
      },
    };
  }

  async byResource(type: string, id: string, page = 1, pageSize = 20) {
    return this.findAll({ page, pageSize, resourceType: type, resourceId: id } as any);
  }
}
