import { IsOptional, IsEnum, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';
import { AppealStatus } from '@prisma/client';

export class ListAppealsDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(AppealStatus) status?: AppealStatus;
}

export class UpdateAppealStatusDto {
  @IsEnum(AppealStatus) status: AppealStatus;
  @IsOptional() @IsString() reviewNote?: string;
}

export class AddAppealNoteDto {
  @IsString() note: string;
}
