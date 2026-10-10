import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.module';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

@Injectable()
export class BookingHistoryService {
  constructor(private prisma: PrismaService) {}

  async getBookingHistory(customerId: string, q: PaginationQueryDto) {
    const where = { customerId };
    const [totalItems, list] = await this.prisma.$transaction([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        include: {
          companion: { select: { id: true, name: true, profilePicUrl: true } },
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
