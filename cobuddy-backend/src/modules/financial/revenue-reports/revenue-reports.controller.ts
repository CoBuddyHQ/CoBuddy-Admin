import { Controller, Get, Query } from '@nestjs/common';
import { RevenueReportsService } from './revenue-reports.service';
import { Roles, AllowModule } from '@/common/decorators/auth.decorators';
import { StaffRole } from '@prisma/client';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';
import { IsDateString } from 'class-validator';

class DateRangeDto {
  @IsDateString() from: string;
  @IsDateString() to: string;
}

@Controller('financial/revenue-reports')
@AllowModule('finance.revenue-reports')
@Roles(StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN)
export class RevenueReportsController {
  constructor(private service: RevenueReportsService) {}

  @Get('overview')
  overview() {
    return this.service.overview();
  }

  @Get('daily')
  daily(@Query() q: DateRangeDto) {
    return this.service.daily(q.from, q.to);
  }

  @Get('by-city')
  byCity(@Query() q: DateRangeDto) {
    return this.service.byCity(q.from, q.to);
  }

  @Get('top-companions')
  topCompanions(@Query() q: PaginationQueryDto) {
    return this.service.topCompanions(q);
  }
}
