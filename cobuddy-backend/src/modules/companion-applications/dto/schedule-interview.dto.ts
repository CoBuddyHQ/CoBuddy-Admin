import { IsDate, IsString, IsNotEmpty, IsOptional, IsUrl, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class ScheduleInterviewDto {
  @Type(() => Date) @IsDate() scheduledAt: Date;
  @IsString() @IsNotEmpty() interviewerStaffId: string;
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  meetingLink?: string;
}
