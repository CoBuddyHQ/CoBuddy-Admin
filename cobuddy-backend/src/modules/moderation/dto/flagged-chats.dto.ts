import { IsString, IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

export class ListFlaggedChatsDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']) severity?:
    'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  @IsOptional() @IsEnum(['PENDING', 'REVIEWED', 'RESOLVED']) status?:
    'PENDING' | 'REVIEWED' | 'RESOLVED';
}

export class DecideFlaggedChatDto {
  @IsEnum(['TAKE_NO_ACTION', 'WARN_BOTH', 'WARN_SENDER', 'BAN_SENDER'])
  action: 'TAKE_NO_ACTION' | 'WARN_BOTH' | 'WARN_SENDER' | 'BAN_SENDER';
  @IsOptional() @IsString() note?: string;
}
