import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';
import { IsTimeAfter } from '@root/libs/validators/is-time-after.validator';
import { IsEnum, IsMilitaryTime } from 'class-validator';

export class CreateOpenHoursDto {
  @ApiProperty({ enum: DayOfWeek })
  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @IsMilitaryTime()
  open!: string;

  @IsMilitaryTime()
  @IsTimeAfter((o: CreateOpenHoursDto) => o.open, {
    message: 'The closing time (close) must be after the opening time (open).',
  })
  close!: string;
}
