import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PromotionStatus, PromotionType } from '@prisma/client';

export class FindAllPromotionsQueryDto {
  @ApiProperty({ enum: PromotionStatus })
  @IsEnum(PromotionStatus)
  status!: PromotionStatus;

  @ApiProperty({ enum: PromotionType, isArray: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim());
    }
    return value;
  })
  @IsEnum(PromotionType, { each: true })
  type!: PromotionType[];
}
