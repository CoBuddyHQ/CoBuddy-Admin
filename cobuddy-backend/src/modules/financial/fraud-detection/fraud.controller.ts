import { Controller, Get, Post, Patch, Param, Query, Body } from '@nestjs/common';
import { FraudDetectionService } from './fraud.service';
import {
  ListFraudFlagsDto,
  UpdateFraudFlagDto,
  AddFraudActionDto,
  CreateFraudFlagDto,
} from './dto/fraud.dto';
import { Roles, AllowModule } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { CurrentUser, AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { StaffRole } from '@prisma/client';

@Controller('financial/fraud-detection')
@AllowModule('finance.fraud')
@Roles(StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN)
export class FraudDetectionController {
  constructor(private service: FraudDetectionService) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @Get()
  list(@Query() q: ListFraudFlagsDto) {
    return this.service.list(q);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.getOne(id);
  }

  @Post()
  @AuditLog({ action: 'CREATE_FRAUD_FLAG', module: 'fraud-detection', resourceType: 'FraudFlag' })
  create(@Body() dto: CreateFraudFlagDto, @CurrentUser() user: AuthStaffPayload) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @AuditLog({
    action: 'UPDATE_FRAUD_FLAG',
    module: 'fraud-detection',
    resourceType: 'FraudFlag',
    resourceIdParam: 'id',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFraudFlagDto,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.update(id, dto, user);
  }

  @Post(':id/actions')
  @AuditLog({
    action: 'ADD_FRAUD_ACTION',
    module: 'fraud-detection',
    resourceType: 'FraudFlag',
    resourceIdParam: 'id',
  })
  addAction(
    @Param('id') id: string,
    @Body() dto: AddFraudActionDto,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.addAction(id, dto, user);
  }
}
