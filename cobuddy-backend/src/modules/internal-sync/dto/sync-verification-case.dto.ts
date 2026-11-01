import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class SyncVerificationCaseDto {
  @IsString()
  @IsOptional()
  caseRef?: string;

  @IsString()
  @IsNotEmpty()
  applicantId: string;

  @IsString()
  @IsIn(['CUSTOMER', 'COMPANION'])
  @IsNotEmpty()
  applicantType: 'COMPANION' | 'CUSTOMER';

  @IsString()
  @IsOptional()
  applicantName?: string;

  @IsString()
  @IsOptional()
  applicantPhone?: string;

  @IsString()
  @IsOptional()
  cityName?: string;

  @IsString()
  @IsNotEmpty()
  documentType?: string;

  @IsString()
  @IsNotEmpty()
  idDocumentUrl?: string;

  @IsString()
  @IsNotEmpty()
  selfieUrl?: string;

  @IsString()
  @IsOptional()
  backgroundDeclarationUrl?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
