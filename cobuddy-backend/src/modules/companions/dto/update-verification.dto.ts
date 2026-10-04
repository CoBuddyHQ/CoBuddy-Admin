import { IsIn } from 'class-validator';
import { UserVerificationStatus } from '@prisma/client';

export class UpdateCompanionVerificationDto {
  @IsIn(Object.values(UserVerificationStatus)) verificationStatus: UserVerificationStatus;
}
