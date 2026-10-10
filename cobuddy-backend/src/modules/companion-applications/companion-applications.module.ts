import { Module } from '@nestjs/common';
import { CompanionApplicationsController } from './companion-applications.controller';
import { CompanionApplicationsService } from './companion-applications.service';

@Module({
  controllers: [CompanionApplicationsController],
  providers: [CompanionApplicationsService],
  exports: [CompanionApplicationsService],
})
export class CompanionApplicationsModule {}
