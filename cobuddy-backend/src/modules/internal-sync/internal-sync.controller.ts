import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { Public } from '@/common/decorators/auth.decorators';
import { InternalServiceGuard } from '@/common/guards/internal-service.guard';
import { InternalSyncService } from './internal-sync.service';
import { SyncBookingDto } from './dto/sync-booking.dto';
import { SyncReviewDto } from './dto/sync-review.dto';
import { SyncVerificationCaseDto } from './dto/sync-verification-case.dto';
import { SyncCompanionApplicationDto } from './dto/sync-companion-application.dto';
import { SyncUserReportDto } from './dto/sync-user-report.dto';

@Controller('internal')
export class InternalSyncController {
  constructor(private readonly service: InternalSyncService) {}

  @Get('master-data/bundle')
  @Public()
  @UseGuards(InternalServiceGuard)
  async getMasterDataBundle() {
    return this.service.getMasterDataBundle();
  }

  @Post('bookings/sync')
  @Public()
  @UseGuards(InternalServiceGuard)
  @HttpCode(HttpStatus.OK)
  async syncBooking(@Body() dto: SyncBookingDto) {
    return this.service.syncBooking(dto);
  }

  @Post('reviews/sync')
  @Public()
  @UseGuards(InternalServiceGuard)
  @HttpCode(HttpStatus.OK)
  async syncReview(@Body() dto: SyncReviewDto) {
    return this.service.syncReview(dto);
  }

  @Post('verification/cases/sync')
  @Public()
  @UseGuards(InternalServiceGuard)
  @HttpCode(HttpStatus.OK)
  async syncVerificationCase(@Body() dto: SyncVerificationCaseDto) {
    return this.service.syncVerificationCase(dto);
  }

  @Post('companion-applications/sync')
  @Public()
  @UseGuards(InternalServiceGuard)
  @HttpCode(HttpStatus.OK)
  async syncCompanionApplication(@Body() dto: SyncCompanionApplicationDto) {
    return this.service.syncCompanionApplication(dto);
  }

  @Post('reports/sync')
  @Public()
  @UseGuards(InternalServiceGuard)
  @HttpCode(HttpStatus.OK)
  async syncUserReport(@Body() dto: SyncUserReportDto) {
    return this.service.syncUserReport(dto);
  }
}
