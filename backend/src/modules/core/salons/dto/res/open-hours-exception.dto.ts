export class OpenHoursExceptionDto {
  id!: string;
  isWorking!: boolean;
  startTime!: Date;
  endTime!: Date;

  constructor({ id, isWorking, startTime, endTime }: OpenHoursExceptionDto) {
    Object.assign(this, {
      id,
      isWorking,
      startTime,
      endTime,
    });
  }
}
