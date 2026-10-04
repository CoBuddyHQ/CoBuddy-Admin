import { IsDate, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ScheduleInterviewDto {
  @Type(() => Date) @IsDate() scheduledAt: Date;
  @IsString() interviewerStaffId: string;
  @IsOptional() @IsString() meetingLink?: string;
}
