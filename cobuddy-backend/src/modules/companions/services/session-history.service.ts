import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.module';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

@Injectable()
export class SessionHistoryService {
  constructor(private prisma: PrismaService) {}

  async getSessionHistory(companionId: string, q: PaginationQueryDto) {
    const companion = await this.prisma.companion.findUnique({ where: { id: companionId } });
    if (!companion) throw new NotFoundException('Companion not found');

    const where = { companionId };
    const [totalItems, list] = await this.prisma.$transaction([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, profilePicUrl: true } },
          venue: { select: { id: true, name: true, address: true } },
        },
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
