import { IsTimeAfter } from '@root/libs/validators/is-time-after.validator';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate } from 'class-validator';

export class CreateOpenHoursExceptionDto {
  @IsBoolean()
  isWorking!: boolean;

  @IsDate()
  @Type(() => Date)
  startTime!: Date;

  @IsDate()
  @Type(() => Date)
  @IsTimeAfter((o: CreateOpenHoursExceptionDto) => o.startTime, {
    message: 'The end time must be after the start time.',
  })
  endTime!: Date;
}
