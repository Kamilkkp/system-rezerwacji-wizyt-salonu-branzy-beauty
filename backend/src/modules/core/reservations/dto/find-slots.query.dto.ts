import { Type } from 'class-transformer';
import { IsDate, IsUUID } from 'class-validator';
import { UUID } from 'crypto';

export class FindSlotsQueryDto {
  @IsUUID()
  serviceId!: UUID;

  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @IsDate()
  @Type(() => Date)
  endDate!: Date;
}
