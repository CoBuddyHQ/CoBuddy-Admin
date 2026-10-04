import { Module } from '@nestjs/common';
import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';
import { AppConfigsController } from './app-configs.controller';
import { AppConfigsService } from './app-configs.service';
import { RootController } from './root.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConfigController, AppConfigsController, RootController],
  providers: [ConfigService, AppConfigsService],
  exports: [ConfigService, AppConfigsService],
})
export class SystemModule {}
