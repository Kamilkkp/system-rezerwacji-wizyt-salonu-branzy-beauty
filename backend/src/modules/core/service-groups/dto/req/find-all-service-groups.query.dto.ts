import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ServiceGroupStatus } from '@prisma/client';

export class FindAllServiceGroupsQueryDto {
  @ApiProperty({ enum: ServiceGroupStatus })
  @IsEnum(ServiceGroupStatus)
  status!: ServiceGroupStatus;
}
