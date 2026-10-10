import { IsIn, IsOptional } from 'class-validator';
import { FilterQueryDto } from '@/common/dto/pagination.dto';

export class CityQueryDto extends FilterQueryDto {
  @IsOptional()
  @IsIn(['areas'])
  include?: 'areas';
}
