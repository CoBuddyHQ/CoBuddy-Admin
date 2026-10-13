import { Body, Controller, Param, Get, Post, Patch, Put, Delete } from '@nestjs/common';
import { AllowModule } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { AuthStaffPayload, CurrentUser } from '@/common/decorators/current-user.decorator';
import { CatalogService } from './catalog.service';
import {
  WorkflowBody,
  eventSchema,
  activeSchema,
  rankingSchema,
  uiSchema,
  promotionSchema,
  venueSchema,
  launchSchema,
  launchStatusSchema,
  checklistSchema,
  waitlistConfigSchema,
  waitlistSchema,
  abuseStatusSchema,
  abuseActionSchema,
  legalSettingsSchema,
} from '@/common/validation/workflow-inputs';

@Controller()
export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  @Get('admin-options/cities')
  @AllowModule('events')
  cities(@CurrentUser() user: AuthStaffPayload) {
    return this.service.cities(user);
  }

  @Get('discovery/events')
  @AllowModule('events')
  events(@CurrentUser() user: AuthStaffPayload) {
    return this.service.events(user);
  }

  @Post('discovery/events')
  @AllowModule('events')
  @AuditLog({ action: 'CREATE_EVENT', module: 'events', resourceIdParam: 'id' })
  createEvent(
    @Body(new WorkflowBody(eventSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.createEvent(body, user);
  }

  @Patch('discovery/events/:id/active')
  @AllowModule('events')
  @AuditLog({ action: 'EVENT_ACTIVE', module: 'events', resourceIdParam: 'id' })
  eventActive(
    @Param('id') id: string,
    @Body(new WorkflowBody(activeSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.eventActive(id, body.active, user);
  }

  @Get('discovery/ranking-config')
  @AllowModule('ranking-config')
  weights() {
    return this.service.weights();
  }

  @Put('discovery/ranking-config')
  @AllowModule('ranking-config')
  @AuditLog({ action: 'SAVE_WEIGHTS', module: 'ranking-config', resourceIdParam: 'id' })
  saveWeights(
    @Body(new WorkflowBody(rankingSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.saveWeights(body, user);
  }

  @Get('discovery/ranking-config/settings')
  @AllowModule('ranking-config')
  ui() {
    return this.service.config('discovery.ui', {
      enableDarkThemeDefault: false,
      homeScreenLayout: 'GRID',
      featuredSectionTitle: 'Featured companions',
      maxFeaturedCompanions: 10,
    });
  }

  @Put('discovery/ranking-config/settings')
  @AllowModule('ranking-config')
  @AuditLog({ action: 'SAVE_UI', module: 'ranking-config', resourceIdParam: 'id' })
  saveUi(@Body(new WorkflowBody(uiSchema)) body: any, @CurrentUser() user: AuthStaffPayload) {
    return this.service.saveConfig('discovery.ui', body, user);
  }

  @Get('discovery/ranking-config/promoted')
  @AllowModule('ranking-config')
  promoted(@CurrentUser() user: AuthStaffPayload) {
    return this.service.promoted(user);
  }

  @Post('discovery/ranking-config/promoted')
  @AllowModule('ranking-config')
  @AuditLog({ action: 'PROMOTE', module: 'ranking-config', resourceIdParam: 'id' })
  promote(
    @Body(new WorkflowBody(promotionSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.promote(body.companionId, body.promotedUntil, user);
  }

  @Delete('discovery/ranking-config/promoted/:id')
  @AllowModule('ranking-config')
  @AuditLog({ action: 'REMOVE_PROMOTION', module: 'ranking-config', resourceIdParam: 'id' })
  removePromotion(@Param('id') id: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.removePromotion(id, user);
  }

  @Get('operations/venues')
  @AllowModule('venues')
  venues(@CurrentUser() user: AuthStaffPayload) {
    return this.service.venues(user);
  }

  @Post('operations/venues')
  @AllowModule('venues')
  @AuditLog({ action: 'CREATE_VENUE', module: 'venues', resourceIdParam: 'id' })
  createVenue(
    @Body(new WorkflowBody(venueSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.saveVenue(body, user);
  }

  @Put('operations/venues/:id')
  @AllowModule('venues')
  @AuditLog({ action: 'UPDATE_VENUE', module: 'venues', resourceIdParam: 'id' })
  updateVenue(
    @Param('id') id: string,
    @Body(new WorkflowBody(venueSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.saveVenue(body, user, id);
  }

  @Patch('operations/venues/:id/active')
  @AllowModule('venues')
  @AuditLog({ action: 'VENUE_ACTIVE', module: 'venues', resourceIdParam: 'id' })
  venueActive(
    @Param('id') id: string,
    @Body(new WorkflowBody(activeSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.venueActive(id, body.active, user);
  }

  @Delete('operations/venues/:id')
  @AllowModule('venues')
  @AuditLog({ action: 'DELETE_VENUE', module: 'venues', resourceIdParam: 'id' })
  deleteVenue(@Param('id') id: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.deleteVenue(id, user);
  }

  @Get('operations/city-launch')
  @AllowModule('city-launch')
  launches(@CurrentUser() user: AuthStaffPayload) {
    return this.service.launches(user);
  }

  @Post('operations/city-launch')
  @AllowModule('city-launch')
  @AuditLog({ action: 'CREATE_LAUNCH', module: 'city-launch', resourceIdParam: 'id' })
  createLaunch(
    @Body(new WorkflowBody(launchSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.createLaunch(body, user);
  }

  @Patch('operations/city-launch/:id/status')
  @AllowModule('city-launch')
  @AuditLog({ action: 'LAUNCH_STATUS', module: 'city-launch', resourceIdParam: 'id' })
  launchStatus(
    @Param('id') id: string,
    @Body(new WorkflowBody(launchStatusSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.launchStatus(id, body.status, user);
  }

  @Patch('operations/city-launch/:id/checklist/:taskId')
  @AllowModule('city-launch')
  @AuditLog({ action: 'CHECKLIST', module: 'city-launch', resourceIdParam: 'id' })
  checklist(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body(new WorkflowBody(checklistSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.checklist(id, taskId, body.completed, user);
  }

  @Get('operations/city-launch/waitlist/config')
  @AllowModule('city-launch')
  waitlistConfig() {
    return this.service.config('operations.waitlist', {
      requireInviteCode: true,
      autoApproveWaitlist: false,
      maxDailyInvites: 100,
    });
  }

  @Put('operations/city-launch/waitlist/config')
  @AllowModule('city-launch')
  @AuditLog({ action: 'SAVE_WAITLIST_CONFIG', module: 'city-launch', resourceIdParam: 'id' })
  saveWaitlistConfig(
    @Body(new WorkflowBody(waitlistConfigSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.saveConfig('operations.waitlist', body, user);
  }

  @Get('operations/city-launch/waitlist')
  @AllowModule('city-launch')
  waitlist(@CurrentUser() user: AuthStaffPayload) {
    return this.service.waitlist(user);
  }

  @Post('operations/city-launch/waitlist')
  @AllowModule('city-launch')
  @AuditLog({ action: 'ADD_WAITLIST', module: 'city-launch', resourceIdParam: 'id' })
  addWaitlist(
    @Body(new WorkflowBody(waitlistSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.addWaitlist(body, user);
  }

  @Post('operations/city-launch/waitlist/:id/approve')
  @AllowModule('city-launch')
  @AuditLog({ action: 'APPROVE_WAITLIST', module: 'city-launch', resourceIdParam: 'id' })
  approveWaitlist(@Param('id') id: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.approveWaitlist(id, user);
  }

  @Get('operations/growth-abuse')
  @AllowModule('growth-abuse')
  abuse(@CurrentUser() user: AuthStaffPayload) {
    return this.service.abuse(user);
  }

  @Patch('operations/growth-abuse/:id/status')
  @AllowModule('growth-abuse')
  @AuditLog({ action: 'ABUSE_STATUS', module: 'growth-abuse', resourceIdParam: 'id' })
  abuseStatus(
    @Param('id') id: string,
    @Body(new WorkflowBody(abuseStatusSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.abuseStatus(id, body.status, user);
  }

  @Post('operations/growth-abuse/:id/actions')
  @AllowModule('growth-abuse')
  @AuditLog({ action: 'ABUSE_ACTION', module: 'growth-abuse', resourceIdParam: 'id' })
  abuseAction(
    @Param('id') id: string,
    @Body(new WorkflowBody(abuseActionSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.abuseAction(id, body.action, user);
  }

  @Get('platform-config/policy-docs/settings')
  @AllowModule('policy-docs')
  legalSettings() {
    return this.service.config('platform.legal', {
      contactEmail: '',
      supportPhone: '',
      termsUrl: '',
      privacyUrl: '',
    });
  }

  @Put('platform-config/policy-docs/settings')
  @AllowModule('policy-docs')
  @AuditLog({ action: 'SAVE_LEGAL_SETTINGS', module: 'policy-docs', resourceIdParam: 'id' })
  saveLegalSettings(
    @Body(new WorkflowBody(legalSettingsSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.saveConfig('platform.legal', body, user);
  }
}
