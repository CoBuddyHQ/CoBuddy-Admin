import { Body, Controller, Param, Get, Post, Put, Patch } from '@nestjs/common';
import { AllowModule } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { AuthStaffPayload, CurrentUser } from '@/common/decorators/current-user.decorator';
import { MarketingService } from './marketing.service';
import {
  WorkflowBody,
  notificationSchema,
  templateSchema,
  referralSchema,
  activeSchema,
} from '@/common/validation/workflow-inputs';

@Controller()
export class MarketingController {
  constructor(private readonly service: MarketingService) {}

  @Get('marketing/notifications')
  @AllowModule('notifications')
  notifications(@CurrentUser() user: AuthStaffPayload) {
    return this.service.notifications(user);
  }

  @Get('marketing/notifications/config')
  @AllowModule('notifications')
  settings() {
    return this.service.settings();
  }

  @Post('marketing/notifications')
  @AllowModule('notifications')
  @AuditLog({ action: 'CREATE', module: 'notifications', resourceIdParam: 'id' })
  create(
    @Body(new WorkflowBody(notificationSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.create(body, user);
  }

  @Post('marketing/notifications/:id/send')
  @AllowModule('notifications')
  @AuditLog({ action: 'QUEUE', module: 'notifications', resourceIdParam: 'id' })
  queue(@Param('id') id: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.queue(id, user);
  }

  @Get('marketing/notifications/:id/receipts')
  @AllowModule('notifications')
  receipts(@Param('id') id: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.receipts(id, user);
  }

  @Get('marketing/announcements')
  @AllowModule('announcements')
  announcements(@CurrentUser() user: AuthStaffPayload) {
    return this.service.notifications(user);
  }

  @Post('marketing/announcements')
  @AllowModule('announcements')
  @AuditLog({ action: 'CREATE_ANNOUNCEMENT', module: 'announcements', resourceIdParam: 'id' })
  createAnnouncement(
    @Body(new WorkflowBody(notificationSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.create(body, user);
  }

  @Get('marketing/templates')
  @AllowModule('notifications')
  templates(@CurrentUser() user: AuthStaffPayload) {
    return this.service.templates(user);
  }

  @Put('marketing/templates')
  @AllowModule('notifications')
  @AuditLog({ action: 'SAVE_TEMPLATE', module: 'notifications', resourceIdParam: 'id' })
  saveTemplate(
    @Body(new WorkflowBody(templateSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.saveTemplate(body, user);
  }

  @Get('marketing/referrals')
  @AllowModule('growth-abuse')
  referrals(@CurrentUser() user: AuthStaffPayload) {
    return this.service.referrals(user);
  }

  @Post('marketing/referrals')
  @AllowModule('growth-abuse')
  @AuditLog({ action: 'CREATE_REFERRAL', module: 'growth-abuse', resourceIdParam: 'id' })
  createReferral(
    @Body(new WorkflowBody(referralSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.createReferral(body, user);
  }

  @Patch('marketing/referrals/:id/active')
  @AllowModule('growth-abuse')
  @AuditLog({ action: 'REFERRAL_ACTIVE', module: 'growth-abuse', resourceIdParam: 'id' })
  referralActive(
    @Param('id') id: string,
    @Body(new WorkflowBody(activeSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.referralActive(id, body.active, user);
  }
}
