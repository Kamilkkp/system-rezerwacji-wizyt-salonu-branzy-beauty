import { ServiceGroupStatus, ServiceStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class ServiceItemDto {
  id!: string;
  name!: string;
  description!: string | null;
  durationMin!: number;
  breakAfterServiceMin!: number;
  technicalBreakMin!: number;

  @ApiProperty({ enum: ServiceStatus })
  status!: ServiceStatus;
  price!: number;
  priceAfterDiscount?: number;
  discount?: string;
  promotionId?: string;

  constructor({
    id,
    name,
    description,
    status,
    price,
    priceAfterDiscount,
    discount,
    durationMin,
    breakAfterServiceMin,
    technicalBreakMin,
    promotionId,
  }: ServiceItemDto) {
    Object.assign(this, {
      id,
      name,
      description,
      status,
      price,
      priceAfterDiscount,
      discount,
      durationMin,
      breakAfterServiceMin,
      technicalBreakMin,
      promotionId,
    });
  }
}

export class ServiceGroupDto {
  id!: string;
  name!: string;
  description!: string | null;

  @ApiProperty({ enum: ServiceGroupStatus })
  status!: ServiceGroupStatus;
  services!: ServiceItemDto[];
  createdAt!: Date;
  updatedAt!: Date;

  constructor({ id, name, description, services, status }: ServiceGroupDto) {
    Object.assign(this, { id, name, description, services, status });
  }
}
