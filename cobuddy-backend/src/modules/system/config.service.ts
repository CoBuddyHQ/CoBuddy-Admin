import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.module';
import { UpdateConfigDto } from './dto/update-config.dto';

@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaService) {}

  async getConfig() {
    let config = await this.prisma.systemDefault.findUnique({
      where: { id: 'singleton' },
    });
    if (!config) {
      config = await this.prisma.systemDefault.create({
        data: { id: 'singleton' },
      });
    }
    return { data: config, message: 'System config fetched' };
  }

  async updateConfig(dto: UpdateConfigDto) {
    let config = await this.prisma.systemDefault.findUnique({
      where: { id: 'singleton' },
    });
    if (!config) {
      config = await this.prisma.systemDefault.create({
        data: { id: 'singleton', ...dto },
      });
    } else {
      config = await this.prisma.systemDefault.update({
        where: { id: 'singleton' },
        data: dto,
      });
    }
    return { data: config, message: 'System config updated' };
  }
}
