import { Module } from '@nestjs/common';
import { InternalSyncController } from './internal-sync.controller';
import { InternalSyncService } from './internal-sync.service';
import { InternalServiceGuard } from '@/common/guards/internal-service.guard';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InternalSyncController],
  providers: [InternalSyncService, InternalServiceGuard],
  exports: [InternalSyncService],
})
export class InternalSyncModule {}
