import { IsEnum, IsOptional } from 'class-validator';
import { EmployeeDepartment } from '@prisma/client';
import { FilterQueryDto } from '@/common/dto/pagination.dto';

export class EmployeeQueryDto extends FilterQueryDto {
  @IsOptional() @IsEnum(EmployeeDepartment) department?: EmployeeDepartment;
}
