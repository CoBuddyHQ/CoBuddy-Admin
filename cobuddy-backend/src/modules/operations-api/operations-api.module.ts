import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { OperationsApiController } from './operations-api.controller';
import { OperationsApiService } from './operations-api.service';

@Module({
  imports: [PrismaModule],
  controllers: [OperationsApiController],
  providers: [OperationsApiService],
})
export class OperationsApiModule {}
