import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class SyncTicketDto {
  @IsString()
  @IsOptional()
  ticketId?: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  userName?: string;

  @IsString()
  @IsIn(['CUSTOMER', 'COMPANION'])
  @IsNotEmpty()
  userType: 'CUSTOMER' | 'COMPANION';

  @IsString()
  @IsNotEmpty()
  categoryCode: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  relatedBookingId?: string;
}

export class SyncTicketMessageDto {
  @IsString()
  @IsNotEmpty()
  senderId: string;

  @IsString()
  @IsNotEmpty()
  senderType: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

