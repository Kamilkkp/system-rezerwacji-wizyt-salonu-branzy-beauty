import { ApiProperty } from '@nestjs/swagger';
import { PromotionType, ReservationStatus } from '@prisma/client';

export class PromotionDto {
  name!: string;
  @ApiProperty({ enum: PromotionType })
  type!: PromotionType;
  value!: number;

  constructor({ name, type, value }: PromotionDto) {
    Object.assign(this, { name, type, value });
  }
}

export class ReservationDto {
  id!: string;
  serviceId!: string;
  clientName!: string;
  clientEmail!: string;
  clientPhone!: string;
  clientNotes!: string;
  startTime!: Date;
  endTime!: Date;
  @ApiProperty({ enum: ReservationStatus })
  status!: ReservationStatus;
  serviceName!: string;
  salonName!: string;
  price!: number;
  promotion?: PromotionDto;

  constructor({
    id,
    clientName,
    clientEmail,
    clientPhone,
    clientNotes,
    startTime,
    endTime,
    status,
    serviceName,
    salonName,
    price,
    promotion,
    serviceId,
  }: ReservationDto) {
    Object.assign(this, {
      id,
      clientName,
      clientEmail,
      clientPhone,
      clientNotes,
      startTime,
      endTime,
      status,
      serviceName,
      salonName,
      price,
      promotion,
      serviceId,
    });
  }
}
