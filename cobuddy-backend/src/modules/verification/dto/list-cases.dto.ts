import { IsOptional, IsEnum } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';
import { VerificationStatus, VerificationApplicantType } from '@prisma/client';

export class ListCasesDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(VerificationStatus) status?: VerificationStatus;

  @IsOptional() @IsEnum(VerificationApplicantType) applicantType?: VerificationApplicantType;
}
