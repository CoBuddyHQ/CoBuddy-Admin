import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { RolesGuard } from '@/common/guards/roles.guard';
import { AllowModule } from '@/common/decorators/auth.decorators';

@UseGuards(RolesGuard)
@Controller('audit-logs')
@AllowModule('system.auditLogs')
export class AuditLogsController {
  constructor(private service: AuditLogsService) {}

  @Get()
  findAll(@Query() q: AuditLogQueryDto) {
    return this.service.findAll(q);
  }
}
