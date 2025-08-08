import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceGroupDto } from './create-service-group.dto';
import { ServiceGroupStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateServiceGroupDto extends PartialType(CreateServiceGroupDto) {
  @IsOptional()
  @IsEnum(ServiceGroupStatus)
  @ApiProperty({ enum: ServiceGroupStatus })
  status?: ServiceGroupStatus;
}
