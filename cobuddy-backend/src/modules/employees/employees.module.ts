import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { InvitationMailer } from './invitation-mailer.service';

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService, InvitationMailer],
  exports: [EmployeesService],
})
export class EmployeesModule {}
