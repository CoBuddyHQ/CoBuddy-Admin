import { Body, Controller, Param, Get, Post, Patch } from '@nestjs/common';
import { AllowModule } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { AuthStaffPayload, CurrentUser } from '@/common/decorators/current-user.decorator';
import { SupportService } from './support.service';
import {
  WorkflowBody,
  ticketSchema,
  ticketStatusSchema,
  replySchema,
  assignmentSchema,
} from '@/common/validation/workflow-inputs';

@Controller()
export class SupportController {
  constructor(private readonly service: SupportService) {}

  @Get('support/tickets')
  @AllowModule('tickets')
  tickets(@CurrentUser() user: AuthStaffPayload) {
    return this.service.tickets(user);
  }

  @Get('support/agents')
  @AllowModule('tickets')
  agents(@CurrentUser() user: AuthStaffPayload) {
    return this.service.agents(user);
  }

  @Post('support/tickets')
  @AllowModule('tickets')
  @AuditLog({ action: 'CREATE', module: 'tickets', resourceIdParam: 'id' })
  create(@Body(new WorkflowBody(ticketSchema)) body: any, @CurrentUser() user: AuthStaffPayload) {
    return this.service.create(body, user);
  }

  @Patch('support/tickets/:id/status')
  @AllowModule('tickets')
  @AuditLog({ action: 'STATUS', module: 'tickets', resourceIdParam: 'id' })
  status(
    @Param('id') id: string,
    @Body(new WorkflowBody(ticketStatusSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.status(id, body.status, body.resolutionNote, user);
  }

  @Post('support/tickets/:id/replies')
  @AllowModule('tickets')
  @AuditLog({ action: 'REPLY', module: 'tickets', resourceIdParam: 'id' })
  reply(
    @Param('id') id: string,
    @Body(new WorkflowBody(replySchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.reply(id, body.message, user);
  }

  @Post('support/tickets/:id/escalate')
  @AllowModule('tickets')
  @AuditLog({ action: 'ESCALATE', module: 'tickets', resourceIdParam: 'id' })
  escalate(@Param('id') id: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.escalate(id, user);
  }

  @Post('support/tickets/:id/assign-self')
  @AllowModule('tickets')
  @AuditLog({ action: 'ASSIGN_SELF', module: 'tickets', resourceIdParam: 'id' })
  assignSelf(@Param('id') id: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.assign(id, user.sub, user, true);
  }

  @Patch('support/tickets/:id/assignment')
  @AllowModule('tickets')
  @AuditLog({ action: 'ASSIGN', module: 'tickets', resourceIdParam: 'id' })
  assign(
    @Param('id') id: string,
    @Body(new WorkflowBody(assignmentSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.assign(id, body.staffId, user);
  }

  @Get('support/sla-dashboard/alerts')
  @AllowModule('sla-dashboard')
  alerts(@CurrentUser() user: AuthStaffPayload) {
    return this.service.alerts(user);
  }

  @Get('support/sla-dashboard/performance')
  @AllowModule('sla-dashboard')
  performance(@CurrentUser() user: AuthStaffPayload) {
    return this.service.performance(user);
  }
}
