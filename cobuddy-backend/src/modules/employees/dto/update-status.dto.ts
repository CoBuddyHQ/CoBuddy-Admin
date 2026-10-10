import { IsEnum } from 'class-validator';
import { EmployeeStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(EmployeeStatus) status: EmployeeStatus;
}
