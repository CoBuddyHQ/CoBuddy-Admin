import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  InterestType,
  ReviewTagPolarity,
  ReviewTagAppliesTo,
  CancellationReasonAppliesTo,
} from '@prisma/client';

export class CreateCityDto {
  @IsString() cityCode: string;
  @IsObject() name: Record<string, any>;
  @IsString() state: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
  @IsOptional() @IsString() serviceHoursOpen?: string;
  @IsOptional() @IsString() serviceHoursClose?: string;
}

export class UpdateCityServiceHoursDto {
  @IsOptional() @IsString() serviceHoursOpen?: string;
  @IsOptional() @IsString() serviceHoursClose?: string;
}

export class CreateAreaDto {
  @IsObject() name: Record<string, any>;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
}

export class CreateInterestDto {
  @IsObject() name: Record<string, any>;
  @IsEnum(InterestType) type: InterestType;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsNumber() @Min(0.1) @Max(10) basePriceMultiplier?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class UpdateInterestMultiplierDto {
  @IsNumber() @Min(0.1) @Max(10) basePriceMultiplier: number;
}

export class CreateSpokenLanguageDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class CreateAppLanguageDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class CreateTicketCategoryDto {
  @IsString() code: string;
  @IsObject() label: Record<string, any>;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class CreateIncidentTypeDto {
  @IsString() code: string;
  @IsObject() label: Record<string, any>;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class CreateCommunicationStyleDto {
  @IsString() code: string;
  @IsObject() label: Record<string, any>;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class CreateActivityPaceDto {
  @IsString() code: string;
  @IsObject() label: Record<string, any>;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class CreateSessionDurationDto {
  @Type(() => Number) @IsNumber() minutes: number;
  @IsObject() label: Record<string, any>;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class CreateNotificationCategoryDto {
  @IsString() code: string;
  @IsObject() label: Record<string, any>;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class CreateReviewTagDto {
  @IsString() code: string;
  @IsObject() label: Record<string, any>;
  @IsEnum(ReviewTagPolarity) polarity: ReviewTagPolarity;
  @IsEnum(ReviewTagAppliesTo) appliesTo: ReviewTagAppliesTo;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class CreateDisputeReasonDto {
  @IsString() code: string;
  @IsObject() label: Record<string, any>;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class CreateCancellationReasonDto {
  @IsString() code: string;
  @IsObject() label: Record<string, any>;
  @IsEnum(CancellationReasonAppliesTo) appliesTo: CancellationReasonAppliesTo;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class CreateKycDocTypeDto {
  @IsString() code: string;
  @IsObject() label: Record<string, any>;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class CreatePlaceTypeDto {
  @IsString() typeName: string;
  @IsObject() displayName: Record<string, any>;
  @IsOptional() @IsBoolean() isAllowed?: boolean;
}

export class UpdatePlaceTypeDto {
  @IsOptional() @IsObject() displayName?: Record<string, any>;
  @IsOptional() @IsBoolean() isAllowed?: boolean;
}

export class UpdateSystemDefaultsDto {
  @IsOptional() @IsString() defaultCurrency?: string;
  @IsOptional() @IsString() defaultLanguage?: string;
  @IsOptional() @IsString() serviceHoursOpen?: string;
  @IsOptional() @IsString() serviceHoursClose?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) platformFeePercent?: number;
}
