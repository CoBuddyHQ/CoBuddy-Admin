import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IncidentStatus } from '@prisma/client';
import { AllowModule } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { AuthStaffPayload, CurrentUser } from '@/common/decorators/current-user.decorator';
import { SafetyApiService } from './safety-api.service';
import { SosAlertQueryDto } from './dto/sos-alert-query.dto';

@Controller()
export class SafetyApiController {
  constructor(private readonly service: SafetyApiService) {}

  @Get('safety/sos')
  @AllowModule('sos-dashboard')
  getSos(@CurrentUser() user: AuthStaffPayload, @Query() query: SosAlertQueryDto) {
    return this.service.getSosAlerts(user, query.activeOnly === 'true');
  }

  @Patch('safety/sos/:id/status')
  @AllowModule('sos-dashboard')
  @AuditLog({
    action: 'UPDATE_SOS_STATUS',
    module: 'safety.sos',
    resourceType: 'SOSAlert',
    resourceIdParam: 'id',
  })
  updateSos(
    @Param('id') id: string,
    @Body() body: { status: string; note?: string },
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.updateSosStatus(id, body.status, body.note, user);
  }

  @Get('safety/incidents')
  @AllowModule('incidents')
  getIncidents() {
    return this.service.getIncidents();
  }

  @Get('safety/incidents/:id')
  @AllowModule('incidents')
  getIncident(@Param('id') id: string) {
    return this.service.getIncident(id);
  }

  @Patch('safety/incidents/:id/status')
  @AllowModule('incidents')
  @AuditLog({
    action: 'UPDATE_SAFETY_INCIDENT',
    module: 'safety.incidents',
    resourceType: 'SafetyIncident',
    resourceIdParam: 'id',
  })
  updateIncident(
    @Param('id') id: string,
    @Body() body: { status: IncidentStatus; note?: string },
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.updateIncident(id, body.status, body.note, user);
  }

  @Post('safety/incidents/:id/preserve-evidence/toggle')
  @AllowModule('incidents')
  @AuditLog({
    action: 'TOGGLE_INCIDENT_EVIDENCE_HOLD',
    module: 'safety.incidents',
    resourceType: 'SafetyIncident',
    resourceIdParam: 'id',
  })
  toggleEvidenceHold(@Param('id') id: string) {
    return this.service.toggleEvidenceHold(id);
  }

  @Get('safety/geofence/alerts')
  @AllowModule('geofence')
  getGeofenceAlerts(@CurrentUser() user: AuthStaffPayload) {
    return this.service.getGeofenceAlerts(user);
  }

  @Patch('safety/geofence/alerts/:id/status')
  @AllowModule('geofence')
  @AuditLog({
    action: 'UPDATE_GEOFENCE_ALERT',
    module: 'safety.geofence',
    resourceType: 'GeofenceAlertEvent',
    resourceIdParam: 'id',
  })
  updateGeofenceAlert(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.updateGeofenceStatus(id, body.status, user);
  }

  @Get('safety/age-escalations')
  @AllowModule('age-escalation')
  getAgeEscalations() {
    return this.service.getAgeEscalations();
  }

  @Patch('safety/age-escalations/:id/status')
  @AllowModule('age-escalation')
  @AuditLog({
    action: 'UPDATE_MINOR_AGE_ESCALATION',
    module: 'safety.ageMinor',
    resourceType: 'MinorAgeEscalation',
    resourceIdParam: 'id',
  })
  updateAgeEscalation(
    @Param('id') id: string,
    @Body() body: { status: string; resolutionNote?: string },
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.updateAgeEscalation(id, body.status, body.resolutionNote, user);
  }

  @Get('safety/emergency-workflows')
  @AllowModule('emergency-workflow')
  getEmergencyWorkflows(@CurrentUser() user: AuthStaffPayload) {
    return this.service.getEmergencyWorkflows(user);
  }

  @Patch('safety/emergency-workflows/:id/status')
  @AllowModule('emergency-workflow')
  @AuditLog({
    action: 'ADVANCE_EMERGENCY_WORKFLOW',
    module: 'safety.emergency',
    resourceType: 'SOSAlert',
    resourceIdParam: 'id',
  })
  advanceEmergencyWorkflow(
    @Param('id') id: string,
    @Body() body: { status: string; actionDetail: string; handler?: string },
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.advanceEmergencyWorkflow(id, body.status, body.actionDetail, user);
  }
}
