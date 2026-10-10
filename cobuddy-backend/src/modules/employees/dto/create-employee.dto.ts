import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayUnique,
} from 'class-validator';
import { StaffRole, EmployeeDepartment } from '@prisma/client';

export class CreateEmployeeDto {
  @IsString() @MinLength(2) @MaxLength(100) name: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() @MinLength(10) @MaxLength(15) phone?: string;
  @IsString() @MinLength(2) @MaxLength(100) designation: string;
  @IsEnum(EmployeeDepartment) department: EmployeeDepartment;
  @IsOptional() @IsString() reportingManagerId?: string;
  @IsArray() @ArrayMinSize(1) @ArrayUnique() @IsEnum(StaffRole, { each: true }) roles: StaffRole[];
  @IsOptional() @IsArray() @IsString({ each: true }) cityScopeIds?: string[];
}
