import { IsArray, IsEnum, IsOptional, IsString, ArrayMinSize, ArrayUnique } from 'class-validator';
import { StaffRole } from '@prisma/client';

export class UpdateRolesDto {
  @IsArray() @ArrayMinSize(1) @ArrayUnique() @IsEnum(StaffRole, { each: true }) roles: StaffRole[];
  @IsOptional() @IsArray() @IsString({ each: true }) cityScopeIds?: string[];
}
