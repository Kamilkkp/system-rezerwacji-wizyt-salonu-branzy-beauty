import { ApiProperty } from '@nestjs/swagger';
import { PromotionStatus, PromotionType } from '@prisma/client';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UUID } from 'crypto';

export class CreatePromotionDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', {
    each: true,
    message: 'Each service group ID must be a valid UUID.',
  })
  @Type(() => String)
  serviceGroupIds?: UUID[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each service ID must be a valid UUID.' })
  @Type(() => String)
  serviceIds?: UUID[];

  @ApiProperty({ enum: PromotionStatus })
  @IsEnum(PromotionStatus)
  status!: PromotionStatus;

  @ApiProperty({ enum: PromotionType })
  @IsEnum(PromotionType)
  type!: PromotionType;

  @Type(() => Number)
  @IsNumber()
  value!: number;

  @Type(() => Date)
  @IsDate()
  startTime!: Date;

  @IsOptional()
  @ValidateIf(
    (o: CreatePromotionDto) => o.endTime !== undefined && o.endTime !== null,
  )
  @Type(() => Date)
  @IsDate()
  endTime?: Date | null;
}
