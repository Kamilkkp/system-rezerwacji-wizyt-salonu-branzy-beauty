import { IsNotEmpty, IsString } from 'class-validator';

export class SendEmailMessageDto {
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
}
