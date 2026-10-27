import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { Public } from '@/common/decorators/auth.decorators';
import { InternalServiceGuard } from '@/common/guards/internal-service.guard';
import { InternalSyncService } from './internal-sync.service';
import { SyncBookingDto } from './dto/sync-booking.dto';
import { SyncReviewDto } from './dto/sync-review.dto';

@Controller('internal')
export class InternalSyncController {
  constructor(private readonly service: InternalSyncService) {}

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
}
