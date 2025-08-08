import { ApiProperty } from '@nestjs/swagger';
import { PromotionStatus, PromotionType } from '@prisma/client';
import { ItemDto } from '@root/libs/api/item.dto';

export class PromotionDto {
  id!: string;
  name!: string;
  serviceGroups!: ItemDto[];
  services!: ItemDto[];
  @ApiProperty({ enum: PromotionStatus })
  status!: PromotionStatus;
  @ApiProperty({ enum: PromotionType })
  type!: PromotionType;
  value!: number;
  startTime!: Date;
  endTime!: Date | null;

  constructor({
    id,
    name,
    serviceGroups,
    services,
    status,
    type,
    value,
    startTime,
    endTime,
  }: PromotionDto) {
    Object.assign(this, {
      id,
      name,
      serviceGroups,
      services,
      status,
      type,
      value,
      startTime,
      endTime,
    });
  }
}
