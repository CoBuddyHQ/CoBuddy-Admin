import { Body, Controller, Param, Get, Post, Patch, Delete, Put } from '@nestjs/common';
import { AllowModule } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { AuthStaffPayload, CurrentUser } from '@/common/decorators/current-user.decorator';
import { ContentService } from './content.service';
import {
  WorkflowBody,
  policySchema,
  policyStatusSchema,
  lessonSchema,
  lessonStatusSchema,
} from '@/common/validation/workflow-inputs';

@Controller()
export class ContentController {
  constructor(private readonly service: ContentService) {}

  @Put('platform-config/policy-docs/:id')
  @AllowModule('policy-docs')
  @AuditLog({ action: 'UPDATE_POLICY_DRAFT', module: 'policy-docs', resourceIdParam: 'id' })
  updatePolicy(
    @Param('id') id: string,
    @Body(new WorkflowBody(policySchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.updatePolicy(id, body, user);
  }

  @Delete('platform-config/policy-docs/:id')
  @AllowModule('policy-docs')
  @AuditLog({ action: 'DELETE_POLICY_DRAFT', module: 'policy-docs', resourceIdParam: 'id' })
  deletePolicy(@Param('id') id: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.deletePolicy(id, user);
  }

  @Put('platform-config/training/:id')
  @AllowModule('training')
  @AuditLog({ action: 'UPDATE_LESSON_DRAFT', module: 'training', resourceIdParam: 'id' })
  updateLesson(
    @Param('id') id: string,
    @Body(new WorkflowBody(lessonSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.updateLesson(id, body, user);
  }

  @Get('platform-config/policy-docs')
  @AllowModule('policy-docs')
  policies() {
    return this.service.policies();
  }

  @Post('platform-config/policy-docs')
  @AllowModule('policy-docs')
  @AuditLog({ action: 'CREATE_POLICY', module: 'policy-docs', resourceIdParam: 'id' })
  createPolicy(
    @Body(new WorkflowBody(policySchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.createPolicy(body, user);
  }

  @Patch('platform-config/policy-docs/:id/status')
  @AllowModule('policy-docs')
  @AuditLog({ action: 'POLICY_STATUS', module: 'policy-docs', resourceIdParam: 'id' })
  policyStatus(
    @Param('id') id: string,
    @Body(new WorkflowBody(policyStatusSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.policyStatus(id, body.status, user);
  }

  @Get('platform-config/policy-docs/consents')
  @AllowModule('policy-docs')
  consents() {
    return this.service.consents();
  }

  @Get('platform-config/training')
  @AllowModule('training')
  lessons() {
    return this.service.lessons();
  }

  @Post('platform-config/training')
  @AllowModule('training')
  @AuditLog({ action: 'CREATE_LESSON', module: 'training', resourceIdParam: 'id' })
  createLesson(
    @Body(new WorkflowBody(lessonSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.createLesson(body, user);
  }

  @Patch('platform-config/training/:id/status')
  @AllowModule('training')
  @AuditLog({ action: 'LESSON_STATUS', module: 'training', resourceIdParam: 'id' })
  lessonStatus(
    @Param('id') id: string,
    @Body(new WorkflowBody(lessonStatusSchema)) body: any,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.lessonStatus(id, body.status, user);
  }

  @Delete('platform-config/training/:id')
  @AllowModule('training')
  @AuditLog({ action: 'DELETE_LESSON', module: 'training', resourceIdParam: 'id' })
  deleteLesson(@Param('id') id: string, @CurrentUser() user: AuthStaffPayload) {
    return this.service.deleteLesson(id, user);
  }

  @Get('platform-config/training/quiz')
  @AllowModule('training')
  quiz() {
    return this.service.quiz();
  }
}
