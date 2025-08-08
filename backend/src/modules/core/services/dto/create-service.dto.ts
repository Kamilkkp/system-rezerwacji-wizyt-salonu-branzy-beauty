import { ApiProperty } from '@nestjs/swagger';
import { ServiceStatus } from '@prisma/client';
import { IsEnum, IsNumber, IsString, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsNumber()
  @Min(0)
  technicalBreakMin!: number;

  @IsNumber()
  @Min(0)
  durationMin!: number;

  @IsNumber()
  @Min(0)
  breakAfterServiceMin!: number;

  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ enum: ServiceStatus })
  @IsEnum(ServiceStatus)
  status!: ServiceStatus;
}
