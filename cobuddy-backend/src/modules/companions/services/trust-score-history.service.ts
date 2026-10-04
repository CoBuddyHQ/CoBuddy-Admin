import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.module';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

@Injectable()
export class TrustScoreHistoryService {
  constructor(private prisma: PrismaService) {}

  async getHistory(companionId: string, q: PaginationQueryDto) {
    const companion = await this.prisma.companion.findUnique({ where: { id: companionId } });
    if (!companion) throw new NotFoundException('Companion not found');

    const where = { companionId };
    const [totalItems, list] = await this.prisma.$transaction([
      this.prisma.trustScoreHistoryEntry.count({ where }),
      this.prisma.trustScoreHistoryEntry.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { date: 'desc' },
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
}
