import { IsString, IsOptional, IsEmail, IsEnum, MinLength, MaxLength } from 'class-validator';
import { EmployeeDepartment } from '@prisma/client';

export class UpdateEmployeeDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MinLength(10) @MaxLength(15) phone?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) designation?: string;
  @IsOptional() @IsEnum(EmployeeDepartment) department?: EmployeeDepartment;
  @IsOptional() @IsString() reportingManagerId?: string;
}
