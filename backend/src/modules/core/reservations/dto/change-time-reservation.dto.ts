import { IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class ChangeTimeReservationDto {
  @IsDate()
  @Type(() => Date)
  startTime!: Date;
}
