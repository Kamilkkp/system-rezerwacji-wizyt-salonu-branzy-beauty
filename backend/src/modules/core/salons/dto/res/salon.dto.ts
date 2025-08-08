import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';

export class OpenHoursDto {
  @ApiProperty({ enum: DayOfWeek })
  dayOfWeek!: DayOfWeek;
  open!: string;
  close!: string;

  constructor({ dayOfWeek, open, close }: OpenHoursDto) {
    Object.assign(this, {
      dayOfWeek,
      open,
      close,
    });
  }
}

export class ContactInfoDto {
  phone?: string;
  email?: string;
  instagramUrl?: string | null;
  facebookUrl?: string | null;

  constructor({ phone, email, instagramUrl, facebookUrl }: ContactInfoDto) {
    Object.assign(this, {
      phone,
      email,
      instagramUrl,
      facebookUrl,
    });
  }
}

export class AddressDto {
  city?: string;
  streetName?: string;
  streetNumber?: string;
  apartment?: string | null;
  postalCode?: string;

  constructor({
    streetName,
    streetNumber,
    apartment,
    postalCode,
    city,
  }: AddressDto) {
    Object.assign(this, {
      streetName,
      streetNumber,
      apartment,
      postalCode,
      city,
    });
  }
}

export class SalonDto {
  id!: string;
  name!: string;
  aboutUs!: string;
  address!: AddressDto | null;
  contactInfo!: ContactInfoDto | null;
  openHours!: OpenHoursDto[];
  slotStepMin!: number;
  reminderMinutesBefore!: number;
  createdAt!: Date;
  updatedAt!: Date;
  frontendUrl!: string | null;
  calendarId!: string | null;

  constructor({
    id,
    name,
    address,
    aboutUs,
    contactInfo,
    openHours,
    slotStepMin,
    reminderMinutesBefore,
    createdAt,
    updatedAt,
    calendarId,
    frontendUrl,
  }: SalonDto) {
    Object.assign(this, {
      id,
      name,
      address,
      aboutUs,
      slotStepMin,
      reminderMinutesBefore,
      contactInfo,
      openHours,
      createdAt,
      updatedAt,
      calendarId,
      frontendUrl,
    });
  }
}
