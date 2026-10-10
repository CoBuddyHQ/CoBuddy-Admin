import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { Roles } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { FilterQueryDto } from '@/common/dto/pagination.dto';
import { MasterDataService } from './master-data.service';
import { CreateTicketCategoryDto } from './dto/master-data.dto';

@Controller('master-data/ticket-categories')
@Roles(StaffRole.SUPER_ADMIN)
export class TicketCategoriesController {
  constructor(private service: MasterDataService) {}

  @Get()
  async findAll(@Query() query: FilterQueryDto) {
    const result = await this.service.findAllPaginated('ticketCategory', query);
    return { data: result.data, meta: result.meta, message: 'Ticket categories fetched' };
  }

  @Post()
  @AuditLog({
    action: 'CREATE_TICKET_CATEGORY',
    module: 'masterData',
    resourceType: 'TicketCategory',
  })
  async create(@Body() dto: CreateTicketCategoryDto) {
    this.service.invalidateBundleCache();
    const record = await this.service.create('ticketCategory', dto);
    return { data: record, message: 'Ticket category created' };
  }

  @Patch(':id/toggle')
  @AuditLog({
    action: 'TOGGLE_TICKET_CATEGORY',
    module: 'masterData',
    resourceType: 'TicketCategory',
    resourceIdParam: 'id',
  })
  async toggle(@Param('id') id: string) {
    this.service.invalidateBundleCache();
    const record = await this.service.toggleActive('ticketCategory', id);
    return { data: record, message: 'Ticket category status toggled' };
  }
}
