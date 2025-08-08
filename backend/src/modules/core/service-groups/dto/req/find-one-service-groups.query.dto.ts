import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ServiceStatus } from '@prisma/client';

export class FindOneServiceGroupsQueryDto {
  @ApiProperty({ enum: ServiceStatus })
  @IsEnum(ServiceStatus)
  status!: ServiceStatus;
}
