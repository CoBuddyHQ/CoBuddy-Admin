import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.module';
import { Prisma } from '@prisma/client';
import { CreateAppConfigDto } from './dto/create-app-config.dto';
import { UpdateAppConfigDto } from './dto/update-app-config.dto';

@Injectable()
export class AppConfigsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const list = await this.prisma.appConfig.findMany({
      orderBy: { configKey: 'asc' },
    });
    return { data: list, message: 'App configs fetched' };
  }

  async findByKey(configKey: string) {
    const cfg = await this.prisma.appConfig.findUnique({ where: { configKey } });
    return { data: cfg, message: 'App config fetched' };
  }

  async upsertByKey(configKey: string, dto: UpdateAppConfigDto) {
    const updateData: any = {};
    if (dto.value !== undefined) updateData.value = dto.value;
    if (dto.description !== undefined) updateData.description = dto.description;

    const cfg = await this.prisma.appConfig.upsert({
      where: { configKey },
      create: {
        configKey,
        value: dto.value ?? Prisma.JsonNull,
        description: dto.description || null,
      },
      update: updateData,
    });
    return { data: cfg, message: 'App config saved' };
  }

  async findOne(id: string) {
    const cfg = await this.prisma.appConfig.findUnique({ where: { id } });
    if (!cfg) throw new NotFoundException('App config not found');
    return { data: cfg, message: 'App config fetched' };
  }

  async create(dto: CreateAppConfigDto) {
    const existing = await this.prisma.appConfig.findUnique({
      where: { configKey: dto.configKey },
    });
    if (existing) throw new ConflictException('Config key already exists');

    const cfg = await this.prisma.appConfig.create({
      data: {
        configKey: dto.configKey,
        value: dto.value ?? Prisma.JsonNull,
        description: dto.description || null,
      },
    });
    return { data: cfg, message: 'App config created' };
  }

  async update(id: string, dto: UpdateAppConfigDto) {
    const existing = await this.prisma.appConfig.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('App config not found');

    const updateData: any = {};
    if (dto.value !== undefined) updateData.value = dto.value;
    if (dto.description !== undefined) updateData.description = dto.description;

    const cfg = await this.prisma.appConfig.update({
      where: { id },
      data: updateData,
    });
    return { data: cfg, message: 'App config updated' };
  }

  async remove(id: string) {
    const existing = await this.prisma.appConfig.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('App config not found');
    await this.prisma.appConfig.delete({ where: { id } });
    return { data: { ok: true }, message: 'App config deleted' };
  }
}
