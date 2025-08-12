import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UUID } from 'crypto';

export class CreateReservationDto {
  @IsUUID()
  serviceId!: UUID;

  @IsDate()
  @Type(() => Date)
  startTime!: Date;

  @IsString()
  @Length(1, 20)
  clientName!: string;

  @IsPhoneNumber()
  clientPhone!: string;

  @IsEmail()
  clientEmail!: string;

  @IsString()
  clientNotes!: string;

  @IsOptional()
  @IsUUID()
  promotionId?: UUID;

  @IsBoolean()
  marketingConsent!: boolean;

  @IsBoolean()
  notificationsConsent!: boolean;
}
