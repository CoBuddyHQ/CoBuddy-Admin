import { Body, Controller, Param, Get, Post, Patch } from '@nestjs/common';
import { AllowModule } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { AuthStaffPayload, CurrentUser } from '@/common/decorators/current-user.decorator';
import { LegalService } from './legal.service';
import {
  WorkflowBody,
  privacySchema,
  privacyStatusSchema,
  holdSchema,
  legalRequestSchema,
  legalStatusSchema,
} from '@/common/validation/workflow-inputs';

@Controller()
export class LegalController {
  constructor(private readonly service: LegalService) {}

  @Get('legal/data-privacy')
  @AllowModule('data-privacy')
  privacy(@CurrentUser() user: AuthStaffPayload) {
    return this.service.privacy(user);
  }

  @Post('legal/data-privacy')
  @AllowModule('data-privacy')
  @AuditLog({ action: 'CREATE_PRIVACY', module: 'data-privacy', resourceIdParam: 'id' })
  createPrivacy(
    @Body(new WorkflowBody(privacySchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.createPrivacy(body, user);
  }

  @Patch('legal/data-privacy/:id/status')
  @AllowModule('data-privacy')
  @AuditLog({ action: 'PRIVACY_STATUS', module: 'data-privacy', resourceIdParam: 'id' })
  privacyStatus(
    @Param('id') id: string,
    @Body(new WorkflowBody(privacyStatusSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.privacyStatus(id, body.status, user);
  }

  @Patch('legal/data-privacy/:id/hold')
  @AllowModule('data-privacy')
  @AuditLog({ action: 'HOLD', module: 'data-privacy', resourceIdParam: 'id' })
  hold(
    @Param('id') id: string,
    @Body(new WorkflowBody(holdSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.hold(id, body.legalHold, user);
  }

  @Get('legal/data-privacy/:id/export')
  @AllowModule('data-privacy')
  export(@Param('id') id: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.export(id, user);
  }

  @Get('legal/legal-requests')
  @AllowModule('legal-requests')
  legal(@CurrentUser() user: AuthStaffPayload) {
    return this.service.legal(user);
  }

  @Post('legal/legal-requests')
  @AllowModule('legal-requests')
  @AuditLog({ action: 'CREATE_LEGAL', module: 'legal-requests', resourceIdParam: 'id' })
  createLegal(
    @Body(new WorkflowBody(legalRequestSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.createLegal(body, user);
  }

  @Patch('legal/legal-requests/:id/status')
  @AllowModule('legal-requests')
  @AuditLog({ action: 'LEGAL_STATUS', module: 'legal-requests', resourceIdParam: 'id' })
  legalStatus(
    @Param('id') id: string,
    @Body(new WorkflowBody(legalStatusSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.legalStatus(id, body.status, user);
  }
}
