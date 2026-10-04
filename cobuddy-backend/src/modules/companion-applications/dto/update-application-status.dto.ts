import { IsString, IsOptional, IsIn } from 'class-validator';
import { APPLICATION_STATUSES, ApplicationStatus } from './companion-application-query.dto';

export class UpdateApplicationStatusDto {
  @IsIn(APPLICATION_STATUSES) status: ApplicationStatus;
  @IsOptional() @IsString() reviewNotes?: string;
}
