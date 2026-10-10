import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { Roles } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { FilterQueryDto } from '@/common/dto/pagination.dto';
import { MasterDataService } from './master-data.service';
import { CreateDisputeReasonDto } from './dto/master-data.dto';

@Controller('master-data/dispute-reasons')
@Roles(StaffRole.SUPER_ADMIN)
export class DisputeReasonsController {
  constructor(private service: MasterDataService) {}

  @Get()
  async findAll(@Query() query: FilterQueryDto) {
    const result = await this.service.findAllPaginated('disputeReason', query);
    return { data: result.data, meta: result.meta, message: 'Dispute reasons fetched' };
  }

  @Post()
  @AuditLog({
    action: 'CREATE_DISPUTE_REASON',
    module: 'masterData',
    resourceType: 'DisputeReason',
  })
  async create(@Body() dto: CreateDisputeReasonDto) {
    this.service.invalidateBundleCache();
    const record = await this.service.create('disputeReason', dto);
    return { data: record, message: 'Dispute reason created' };
  }

  @Patch(':id/toggle')
  @AuditLog({
    action: 'TOGGLE_DISPUTE_REASON',
    module: 'masterData',
    resourceType: 'DisputeReason',
    resourceIdParam: 'id',
  })
  async toggle(@Param('id') id: string) {
    this.service.invalidateBundleCache();
    const record = await this.service.toggleActive('disputeReason', id);
    return { data: record, message: 'Dispute reason status toggled' };
  }
}
