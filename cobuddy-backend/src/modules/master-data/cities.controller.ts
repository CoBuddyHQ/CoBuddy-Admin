import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Param,
  Body,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { Roles } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { CityQueryDto } from './dto/city-query.dto';
import { MasterDataService } from './master-data.service';
import { PrismaService } from '@/prisma/prisma.module';
import { CreateCityDto, UpdateCityServiceHoursDto, CreateAreaDto } from './dto/master-data.dto';

@Controller('master-data/cities')
@Roles(StaffRole.SUPER_ADMIN)
export class CitiesController {
  constructor(
    private service: MasterDataService,
    private prisma: PrismaService,
  ) {}

  @Get()
  async findAll(@Query() query: CityQueryDto) {
    const includeObj = query.include === 'areas' ? { areas: true } : undefined;
    const result = await this.service.findAllPaginated('city', query, includeObj);
    return { data: result.data, meta: result.meta, message: 'Cities fetched' };
  }

  @Post()
  @AuditLog({ action: 'CREATE_CITY', module: 'masterData', resourceType: 'City' })
  async create(@Body() dto: CreateCityDto) {
    this.service.invalidateBundleCache();
    const city = await this.service.create('city', dto);
    return { data: city, message: 'City created' };
  }

  @Patch(':id/toggle')
  @AuditLog({
    action: 'TOGGLE_CITY',
    module: 'masterData',
    resourceType: 'City',
    resourceIdParam: 'id',
  })
  async toggle(@Param('id') id: string) {
    this.service.invalidateBundleCache();
    const city = await this.service.toggleActive('city', id);
    return { data: city, message: 'City status toggled' };
  }

  @Put(':id/service-hours')
  @AuditLog({
    action: 'UPDATE_CITY_HOURS',
    module: 'masterData',
    resourceType: 'City',
    resourceIdParam: 'id',
  })
  async updateServiceHours(@Param('id') id: string, @Body() dto: UpdateCityServiceHoursDto) {
    this.service.invalidateBundleCache();
    const city = await this.service.update('city', id, dto);
    return { data: city, message: 'City service hours updated' };
  }

  @Post(':id/areas')
  @AuditLog({
    action: 'CREATE_AREA',
    module: 'masterData',
    resourceType: 'Area',
    resourceIdParam: 'id',
  })
  async createArea(@Param('id') cityId: string, @Body() dto: CreateAreaDto) {
    await this.service.findById('city', cityId);
    this.service.invalidateBundleCache();
    const area = await this.prisma.area.create({
      data: { ...dto, cityId },
    });
    return { data: area, message: 'Area created' };
  }

  @Patch(':id/areas/:areaId/toggle')
  @AuditLog({
    action: 'TOGGLE_AREA',
    module: 'masterData',
    resourceType: 'Area',
    resourceIdParam: 'areaId',
  })
  async toggleArea(@Param('id') cityId: string, @Param('areaId') areaId: string) {
    const area = await this.prisma.area.findUnique({ where: { id: areaId } });
    if (!area || area.cityId !== cityId) {
      throw new NotFoundException('Area not found for this city');
    }
    this.service.invalidateBundleCache();
    const updated = await this.prisma.area.update({
      where: { id: areaId },
      data: { active: !area.active },
    });
    return { data: updated, message: 'Area status toggled' };
  }
}
