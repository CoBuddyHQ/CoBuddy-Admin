import { IsIn } from 'class-validator';
import { UserVerificationStatus } from '@prisma/client';

export class UpdateCustomerVerificationDto {
  @IsIn(Object.values(UserVerificationStatus)) verificationStatus: UserVerificationStatus;
}
