import { IsString } from 'class-validator';

export class AddApplicationNoteDto {
  @IsString() note: string;
}
