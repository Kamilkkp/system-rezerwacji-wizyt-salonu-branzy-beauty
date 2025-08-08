import { ApiProperty } from '@nestjs/swagger';
import { ServiceStatus } from '@prisma/client';

export class ServiceDto {
  id!: string;
  name!: string;
  description!: string;
  durationMin!: number;
  breakAfterServiceMin!: number;
  technicalBreakMin!: number;
  price!: number;
  @ApiProperty({ enum: ServiceStatus })
  status!: ServiceStatus;
  updatedAt!: Date;
  createdAt!: Date;

  constructor({
    id,
    name,
    description,
    durationMin,
    breakAfterServiceMin,
    technicalBreakMin,
    price,
    status,
    updatedAt,
    createdAt,
  }: ServiceDto) {
    Object.assign(this, {
      id,
      name,
      description,
      durationMin,
      breakAfterServiceMin,
      technicalBreakMin,
      price,
      status,
      createdAt,
      updatedAt,
    });
  }
}
