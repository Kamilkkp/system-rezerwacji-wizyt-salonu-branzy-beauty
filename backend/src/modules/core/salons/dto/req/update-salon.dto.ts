import { PartialType } from '@nestjs/swagger';
import { CreateSalonDto } from './create-salon.dto';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { UpdateAddressDto } from './update-address.dto';
import { Type } from 'class-transformer';
import { UpdateContactInfoDto } from './update-contact-info.dto';
import { CreateOpenHoursDto } from './create-open-hours.dto';

export class UpdateSalonDto extends PartialType(CreateSalonDto) {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAddressDto)
  address?: UpdateAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateContactInfoDto)
  contactInfo?: UpdateContactInfoDto;

  @IsOptional()
  @IsString()
  aboutUs?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @ArrayMaxSize(7)
  @ArrayUnique((o: CreateOpenHoursDto) => o.dayOfWeek, {
    message: 'Duplicate dayOfWeek values are not allowed.',
  })
  @Type(() => CreateOpenHoursDto)
  openHours?: CreateOpenHoursDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  slotStepMin?: number;

  @IsOptional()
  @IsString()
  frontendUrl?: string;

  @IsOptional()
  @ValidateIf((o: UpdateSalonDto) => o.calendarId !== null)
  @IsUUID()
  calendarId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  reminderMinutesBefore?: number;
}
