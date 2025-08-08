import { DailySlotStatusValue } from '../enums/daily-slot-status-value.enum';

export class TimeSlotDto {
  startTime!: string;

  /**
   * @example "10:00"
   */
  endTime!: string;

  /**
   * @example "2023-11-15T09:15:00.000Z"
   */
  value!: Date;

  constructor({ startTime, endTime, value }: TimeSlotDto) {
    Object.assign(this, { startTime, endTime, value });
  }
}

export class DailySlotsDto {
  /**
   * @example "2023-11-15"
   */
  date!: string;
  status!: DailySlotStatusValue;
  slots?: TimeSlotDto[];

  constructor({ date, status, slots }: DailySlotsDto) {
    Object.assign(this, { date, status, slots });
  }
}
