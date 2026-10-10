import { Module } from '@nestjs/common';
import { RevenueReportsController } from './revenue-reports.controller';
import { RevenueReportsService } from './revenue-reports.service';

@Module({
  controllers: [RevenueReportsController],
  providers: [RevenueReportsService],
})
export class RevenueReportsModule {}
