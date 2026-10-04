import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { SafetyApiController } from './safety-api.controller';
import { SafetyApiService } from './safety-api.service';

@Module({
  imports: [PrismaModule],
  controllers: [SafetyApiController],
  providers: [SafetyApiService],
})
export class SafetyApiModule {}
