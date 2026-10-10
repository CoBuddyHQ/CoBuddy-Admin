import { GeofenceAlertStatus, IncidentStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

class OptionalNoteDto {
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ obj }) => obj.note)
  @IsString()
  @MaxLength(2000)
  @Matches(/\S/)
  note?: string;
}

export class UpdateSosDto extends OptionalNoteDto {
  @IsIn([
    'ACTIVE',
    'TRIGGERED',
    'ACKNOWLEDGED',
    'INVESTIGATING',
    'RESOLVED',
    'RESOLVED_FALSE_ALARM',
    'RESOLVED_REAL_INCIDENT',
    'ESCALATED_AUTHORITIES',
  ])
  status: string;
}

export class UpdateIncidentDto extends OptionalNoteDto {
  @IsEnum(IncidentStatus)
  status: IncidentStatus;
}

export class UpdateGeofenceDto {
  @IsEnum(GeofenceAlertStatus)
  status: GeofenceAlertStatus;
}

export class UpdateAgeEscalationDto {
  @IsIn(['PENDING_REVIEW', 'FROZEN', 'RESOLVED_CLEARED', 'RESOLVED_BANNED'])
  status: string;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ obj }) => obj.resolutionNote)
  @IsString()
  @MaxLength(2000)
  @Matches(/\S/)
  resolutionNote?: string;
}

export class AdvanceEmergencyDto {
  @IsIn(['STEP_1_CONTACT_USER', 'STEP_2_DISPATCH_AUTHORITIES', 'STEP_3_LEGAL_HOLD', 'RESOLVED'])
  status: string;

  @Transform(({ obj }) => obj.actionDetail)
  @IsString()
  @MaxLength(2000)
  @Matches(/\S/)
  actionDetail: string;
}
