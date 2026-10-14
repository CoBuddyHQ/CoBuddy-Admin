import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { AllowModule } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { AuthStaffPayload, CurrentUser } from '@/common/decorators/current-user.decorator';
import { OperationsApiService } from './operations-api.service';
import { MatchmakingConfigDto } from './dto/matchmaking-config.dto';
import { OverrideDisputeRefundDto, UpdateDisputeStatusDto } from './dto/dispute.dto';
import { requireGlobal } from '@/common/auth/city-scope';

@Controller()
export class OperationsApiController {
  constructor(private readonly service: OperationsApiService) {}

  @Get('operations/matchmaking/config')
  @AllowModule('matchmaking')
  getMatchmakingConfig() {
    return this.service.getMatchmakingConfig();
  }

  @Put('operations/matchmaking/config')
  @AllowModule('matchmaking')
  @AuditLog({
    action: 'UPDATE_MATCHMAKING_CONFIG',
    module: 'matchmaking',
    resourceType: 'AppConfig',
  })
  updateMatchmakingConfig(
    @Body() dto: MatchmakingConfigDto,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    requireGlobal(user);
    return this.service.updateMatchmakingConfig(dto);
  }

  @Get('operations/active-sessions')
  @AllowModule('ops.activeSessions')
  activeSessions(@CurrentUser() user: AuthStaffPayload) {
    return this.service.listBookings(
      [BookingStatus.ARRIVING, BookingStatus.IN_PROGRESS, BookingStatus.EXTENDED],
      user,
    );
  }

  @Get('operations/completed-bookings')
  @AllowModule('ops.completed')
  completedBookings(@CurrentUser() user: AuthStaffPayload) {
    return this.service.listBookings([BookingStatus.COMPLETED], user);
  }

  @Get('operations/cancelled-bookings')
  @AllowModule('ops.cancelled')
  cancelledBookings(@CurrentUser() user: AuthStaffPayload) {
    return this.service.listBookings(
      [
        BookingStatus.CUSTOMER_CANCELLED,
        BookingStatus.COMPANION_CANCELLED,
        BookingStatus.COMPANION_EARLY_END,
        BookingStatus.REJECTED_BY_COMPANION,
        BookingStatus.NO_SHOW_CUSTOMER,
        BookingStatus.NO_SHOW_COMPANION,
        BookingStatus.ADMIN_CANCELLED,
      ],
      user,
    );
  }

  @Get('operations/live-map/active-bookings')
  @AllowModule('ops.liveMap')
  liveMapBookings(@CurrentUser() user: AuthStaffPayload) {
    return this.service.listBookings(
      [BookingStatus.ARRIVING, BookingStatus.IN_PROGRESS, BookingStatus.EXTENDED],
      user,
    );
  }

  @Post('safety/live-sessions/:bookingId/safety-check')
  @AllowModule('safety.liveSessions')
  @AuditLog({
    action: 'TRIGGER_LIVE_SESSION_SAFETY_CHECK',
    module: 'safety.liveSessions',
    resourceType: 'Booking',
    resourceIdParam: 'bookingId',
  })
  safetyCheck(@Param('bookingId') bookingId: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.flagLiveSession(bookingId, user);
  }

  @Post('safety/live-sessions/:bookingId/resolve-sos')
  @AllowModule('safety.liveSessions')
  @AuditLog({
    action: 'RESOLVE_LIVE_SESSION_SOS',
    module: 'safety.liveSessions',
    resourceType: 'Booking',
    resourceIdParam: 'bookingId',
  })
  resolveLiveSessionSos(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.resolveLiveSessionSos(bookingId, user);
  }

  @Get('safety/live-sessions')
  @AllowModule('safety.liveSessions')
  liveSafetySessions(@CurrentUser() user: AuthStaffPayload) {
    return this.service.listBookings([BookingStatus.IN_PROGRESS, BookingStatus.EXTENDED], user);
  }

  @Get('operations/session-audit')
  @AllowModule('ops.sessionAudit')
  sessionAudit(
    @Query('sessionId') sessionId: string | undefined,
    @Query('dateFrom') dateFrom: string | undefined,
    @Query('dateTo') dateTo: string | undefined,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.listSessionAudit({ sessionId, dateFrom, dateTo }, user);
  }

  @Get('bookings/disputes')
  @AllowModule('ops.disputes')
  disputes(@CurrentUser() user: AuthStaffPayload) {
    return this.service.listDisputes(user);
  }

  @Patch('bookings/disputes/:id/status')
  @AllowModule('ops.disputes')
  @AuditLog({
    action: 'UPDATE_BOOKING_DISPUTE',
    module: 'ops.disputes',
    resourceType: 'BookingDispute',
    resourceIdParam: 'id',
  })
  updateDisputeStatus(
    @Param('id') id: string,
    @Body() body: UpdateDisputeStatusDto,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.updateDisputeStatus(id, body, user);
  }

  @Post('bookings/disputes/:id/penalty-override')
  @AllowModule('ops.disputes')
  @AuditLog({
    action: 'OVERRIDE_DISPUTE_PENALTY',
    module: 'ops.disputes',
    resourceType: 'BookingDispute',
    resourceIdParam: 'id',
  })
  overridePenalty(
    @Param('id') id: string,
    @Body() body: OverrideDisputeRefundDto,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.overrideDisputePenalty(id, body, user);
  }
}
