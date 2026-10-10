import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { ListReconciliationDto, ResolveReconciliationDto } from './dto/reconciliation.dto';
import { Roles, AllowModule } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { CurrentUser, AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { StaffRole } from '@prisma/client';

@Controller('financial/reconciliation')
@AllowModule('finance.reconciliation')
@Roles(StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN)
export class ReconciliationController {
  constructor(private service: ReconciliationService) {}

  @Get('summary')
  summary() {
    return this.service.summary();
  }

  @Get()
  list(@Query() q: ListReconciliationDto) {
    return this.service.list(q);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.getOne(id);
  }

  @Post(':id/resolve')
  @AuditLog({
    action: 'RESOLVE_RECONCILIATION',
    module: 'reconciliation',
    resourceType: 'ReconciliationRecord',
    resourceIdParam: 'id',
  })
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveReconciliationDto,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.resolve(id, dto, user);
  }
}
