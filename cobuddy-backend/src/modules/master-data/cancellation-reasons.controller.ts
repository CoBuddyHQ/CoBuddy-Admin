import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { Roles } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { FilterQueryDto } from '@/common/dto/pagination.dto';
import { MasterDataService } from './master-data.service';
import { CreateCancellationReasonDto } from './dto/master-data.dto';

@Controller('master-data/cancellation-reasons')
@Roles(StaffRole.SUPER_ADMIN)
export class CancellationReasonsController {
  constructor(private service: MasterDataService) {}

  @Get()
  async findAll(@Query() query: FilterQueryDto) {
    const result = await this.service.findAllPaginated('cancellationReason', query);
    return { data: result.data, meta: result.meta, message: 'Cancellation reasons fetched' };
  }

  @Post()
  @AuditLog({
    action: 'CREATE_CANCELLATION_REASON',
    module: 'masterData',
    resourceType: 'CancellationReason',
  })
  async create(@Body() dto: CreateCancellationReasonDto) {
    this.service.invalidateBundleCache();
    const record = await this.service.create('cancellationReason', dto);
    return { data: record, message: 'Cancellation reason created' };
  }

  @Patch(':id/toggle')
  @AuditLog({
    action: 'TOGGLE_CANCELLATION_REASON',
    module: 'masterData',
    resourceType: 'CancellationReason',
    resourceIdParam: 'id',
  })
  async toggle(@Param('id') id: string) {
    this.service.invalidateBundleCache();
    const record = await this.service.toggleActive('cancellationReason', id);
    return { data: record, message: 'Cancellation reason status toggled' };
  }
}
