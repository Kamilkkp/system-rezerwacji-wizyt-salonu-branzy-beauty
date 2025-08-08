import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Length,
  ValidateIf,
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

  @ValidateIf((o: CreateReservationDto) => o.promotionId !== undefined)
  @IsUUID()
  promotionId?: UUID;

  @IsBoolean()
  marketingConsent!: boolean;

  @IsBoolean()
  notificationsConsent!: boolean;
}
