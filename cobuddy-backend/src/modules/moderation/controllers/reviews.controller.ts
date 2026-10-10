import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ModerationService } from '../moderation.service';
import { ListReviewsDto, RemoveReviewDto } from '../dto/reviews.dto';
import { AllowModule, Roles } from '@/common/decorators/auth.decorators';
import { StaffRole } from '@prisma/client';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { CurrentUser, AuthStaffPayload } from '@/common/decorators/current-user.decorator';

@Controller('moderation/reviews')
@AllowModule('reviews')
export class ReviewsController {
  constructor(private service: ModerationService) {}

  @Get()
  list(@Query() dto: ListReviewsDto) {
    return this.service.listReviews(dto);
  }

  @Post(':id/approve')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({
    action: 'REVIEW_APPROVE',
    module: 'moderation',
    resourceType: 'Review',
    resourceIdParam: 'id',
    captureDiff: true,
  })
  approve(@Param('id') id: string, @CurrentUser() u: AuthStaffPayload) {
    return this.service.approveReview(id, u);
  }

  @Post(':id/remove')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({
    action: 'REVIEW_REMOVE',
    module: 'moderation',
    resourceType: 'Review',
    resourceIdParam: 'id',
    captureDiff: true,
  })
  remove(
    @Param('id') id: string,
    @Body() dto: RemoveReviewDto,
    @CurrentUser() u: AuthStaffPayload,
  ) {
    return this.service.removeReview(id, dto, u);
  }

  @Post(':id/flag')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({
    action: 'REVIEW_FLAG',
    module: 'moderation',
    resourceType: 'Review',
    resourceIdParam: 'id',
    captureDiff: true,
  })
  flag(@Param('id') id: string, @CurrentUser() u: AuthStaffPayload) {
    return this.service.flagReview(id, u);
  }
}
