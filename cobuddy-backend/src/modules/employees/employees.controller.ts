import { Controller, Get, Post, Put, Patch, Body, Param, Query, HttpCode } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateRolesDto } from './dto/update-roles.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import {
  Roles,
  Public,
  AllowModule,
  CurrentUser,
  AuthStaffPayload,
} from '@/common/decorators/auth.decorators';
import { StaffRole } from '@prisma/client';
import { AuditLog } from '@/common/decorators/audit-log.decorator';

@Controller('employees')
@AllowModule('system.employees')
export class EmployeesController {
  constructor(private service: EmployeesService) {}

  @Get()
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.HR_ADMIN)
  findAll(@Query() q: EmployeeQueryDto) {
    return this.service.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.HR_ADMIN)
  @AuditLog({
    action: 'CREATE_EMPLOYEE',
    module: 'system.employees',
    resourceType: 'StaffEmployee',
    captureDiff: true,
  })
  create(@Body() dto: CreateEmployeeDto, @CurrentUser() actor: AuthStaffPayload) {
    return this.service.create(dto, actor);
  }

  @Put(':id')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.HR_ADMIN)
  @AuditLog({
    action: 'UPDATE_EMPLOYEE',
    module: 'system.employees',
    resourceType: 'StaffEmployee',
    resourceIdParam: 'id',
    captureDiff: true,
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() actor: AuthStaffPayload,
  ) {
    return this.service.update(id, dto, actor);
  }

  @Patch(':id/roles')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.HR_ADMIN)
  @AuditLog({
    action: 'UPDATE_EMPLOYEE_ROLES',
    module: 'system.employees',
    resourceType: 'StaffEmployee',
    resourceIdParam: 'id',
    captureDiff: true,
  })
  updateRoles(
    @Param('id') id: string,
    @Body() dto: UpdateRolesDto,
    @CurrentUser() actor: AuthStaffPayload,
  ) {
    return this.service.updateRoles(id, dto, actor);
  }

  @Patch(':id/status')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.HR_ADMIN)
  @AuditLog({
    action: 'UPDATE_EMPLOYEE_STATUS',
    module: 'system.employees',
    resourceType: 'StaffEmployee',
    resourceIdParam: 'id',
    captureDiff: true,
  })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() actor: AuthStaffPayload,
  ) {
    return this.service.updateStatus(id, dto, actor);
  }

  @Post(':id/resend-invite')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.HR_ADMIN)
  @HttpCode(200)
  @AuditLog({
    action: 'RESEND_INVITE',
    module: 'system.employees',
    resourceType: 'StaffEmployee',
    resourceIdParam: 'id',
  })
  resendInvite(@Param('id') id: string, @CurrentUser() actor: AuthStaffPayload) {
    return this.service.resendInvite(id, actor);
  }

  @Public()
  @Post(':id/accept-invite')
  @HttpCode(200)
  @AuditLog({
    action: 'ACCEPT_INVITE',
    module: 'system.employees',
    resourceType: 'StaffEmployee',
    resourceIdParam: 'id',
  })
  acceptInvite(@Param('id') id: string, @Body() dto: AcceptInviteDto) {
    return this.service.acceptInvite(dto, id);
  }

  @Post(':id/force-logout')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.HR_ADMIN)
  @HttpCode(200)
  @AuditLog({
    action: 'FORCE_LOGOUT',
    module: 'system.employees',
    resourceType: 'StaffEmployee',
    resourceIdParam: 'id',
  })
  forceLogout(@Param('id') id: string, @CurrentUser() actor: AuthStaffPayload) {
    return this.service.forceLogout(id, actor);
  }
}
