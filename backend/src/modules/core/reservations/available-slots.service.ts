import { Injectable } from '@nestjs/common';
import { addMinutes, subMinutes, eachDayOfInterval, isBefore } from 'date-fns';
import { UUID } from 'crypto';
import { InjectTransaction, Transaction } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { DailySlotsDto, TimeSlotDto } from './dto/daily-slots.dto';
import {
  ReservationStatus,
  Service,
  ScheduleOverride,
  OpenHours,
  Prisma,
} from '@prisma/client';
import { DailySlotStatusValue } from './enums/daily-slot-status-value.enum';
import { formatInTimeZone, toDate } from 'date-fns-tz';

interface WorkingBlock {
  start: Date;
  end: Date;
}

const timeZone = 'Europe/Warsaw';

@Injectable()
export class AvailableSlotsService {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
  ) {}

  async findAvailableSlotsInRange(
    salonId: UUID,
    serviceId: UUID,
    startDate: Date,
    endDate: Date,
  ): Promise<DailySlotsDto[]> {
    const now = new Date();
    startDate = toDate(startDate, { timeZone });

    if (isBefore(startDate, now)) {
      startDate = now;
    }

    const [salon, service, data] = await Promise.all([
      this.tx.salon.findUniqueOrThrow({ where: { id: salonId } }),
      this.tx.service.findUniqueOrThrow({ where: { id: serviceId } }),
      this.getAvailabilityData(salonId, startDate, endDate),
    ]);

    const results: DailySlotsDto[] = [];
    const daysToCalculate = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    for (const day of daysToCalculate) {
      const dayStr = formatInTimeZone(day, timeZone, 'yyyy-MM-dd');
      const dayData = data.get(dayStr);

      if (!dayData || dayData.workingBlocks.length === 0) {
        results.push({ date: dayStr, status: DailySlotStatusValue.CLOSED });
        continue;
      }

      const availableSlots = this.calculateAvailableSlots(
        salon.slotStepMin,
        service,
        dayData.workingBlocks,
        dayData.busyBlocks,
      );

      const filteredSlots = availableSlots.filter((slot) => {
        const slotDateTime = toDate(slot, {
          timeZone,
        });
        return !isBefore(slotDateTime, now);
      });

      if (filteredSlots.length === 0) {
        results.push({
          date: dayStr,
          status: DailySlotStatusValue.FULLY_BOOKED,
        });
      } else {
        results.push(
          new DailySlotsDto({
            date: dayStr,
            status: DailySlotStatusValue.AVAILABLE,
            slots: this.formatSlots(filteredSlots, service),
          }),
        );
      }
    }

    return results;
  }

  private async getAvailabilityData(
    salonId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const [openHours, overrides, reservations] = await Promise.all([
      this.tx.openHours.findMany({ where: { salonId } }),
      this.tx.scheduleOverride.findMany({
        where: {
          salonId,
          startTime: { lte: endDate },
          endTime: { gte: startDate },
        },
      }),
      this.tx.reservation.findMany({
        where: {
          service: { serviceGroup: { salonId } },
          startTime: { gte: startDate, lte: endDate },
          status: { not: ReservationStatus.CANCELLED },
        },
        include: { service: true },
      }),
    ]);

    const result = new Map<
      string,
      {
        workingBlocks: WorkingBlock[];
        busyBlocks: WorkingBlock[];
      }
    >();

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    days.forEach((day, index) => {
      const dayStr = formatInTimeZone(day, timeZone, 'yyyy-MM-dd');
      const isFirstDay = index === 0;
      const isLastDay = index === days.length - 1;

      const dayStart = new Date(isFirstDay ? startDate : day);
      if (!isFirstDay) dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(isLastDay ? endDate : day);
      if (!isLastDay) dayEnd.setHours(23, 59, 59, 999);

      const trimBlocks = (blocks: WorkingBlock[]) =>
        blocks
          .filter((block) => block.end > dayStart && block.start < dayEnd)
          .map((block) => ({
            start: block.start < dayStart ? dayStart : new Date(block.start),
            end: block.end > dayEnd ? dayEnd : new Date(block.end),
          }));

      result.set(dayStr, {
        workingBlocks: trimBlocks(
          this.getWorkingBlocksForDay(day, openHours, overrides),
        ),
        busyBlocks: trimBlocks(this.getBusyBlocksForDay(day, reservations)),
      });
    });

    return result;
  }

  private getWorkingBlocksForDay(
    date: Date,
    openHours: OpenHours[],
    overrides: ScheduleOverride[],
  ): WorkingBlock[] {
    const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][
      date.getDay()
    ];
    const todayOpenHours = openHours.find((oh) => oh.dayOfWeek === dayOfWeek);

    let workingBlocks: WorkingBlock[] = [];

    if (todayOpenHours) {
      const [openH, openM] = todayOpenHours.open.split(':').map(Number);
      const [closeH, closeM] = todayOpenHours.close.split(':').map(Number);

      const start = new Date(date);
      start.setHours(openH, openM, 0, 0);

      const end = new Date(date);
      end.setHours(closeH, closeM, 0, 0);

      if (end > start) {
        workingBlocks.push({ start, end });
      }
    }

    const dayOffOverrides = overrides.filter((o) => !o.isWorking);
    const extraWorkOverrides = overrides.filter((o) => o.isWorking);

    dayOffOverrides.forEach((override) => {
      workingBlocks = workingBlocks.flatMap((block) => {
        const offStart = new Date(
          Math.max(override.startTime.getTime(), block.start.getTime()),
        );
        const offEnd = new Date(
          Math.min(override.endTime.getTime(), block.end.getTime()),
        );

        if (offEnd <= block.start || offStart >= block.end) return [block];

        const newBlocks: WorkingBlock[] = [];
        if (offStart > block.start)
          newBlocks.push({ start: block.start, end: offStart });
        if (offEnd < block.end)
          newBlocks.push({ start: offEnd, end: block.end });
        return newBlocks;
      });
    });

    extraWorkOverrides.forEach((override) => {
      workingBlocks.push({
        start: new Date(Math.max(override.startTime.getTime(), date.getTime())),
        end: new Date(
          Math.min(
            override.endTime.getTime(),
            new Date(date).setHours(23, 59, 59, 999),
          ),
        ),
      });
    });

    return workingBlocks;
  }

  private calculateAvailableSlots(
    slotStep: number,
    service: Service,
    workingBlocks: WorkingBlock[],
    busyBlocks: WorkingBlock[],
  ): Date[] {
    const availableSlots: Date[] = [];
    const serviceDuration = service.durationMin + service.breakAfterServiceMin;

    workingBlocks.forEach((block) => {
      let currentSlot = new Date(block.start);
      const endSlot = subMinutes(block.end, serviceDuration);

      while (currentSlot <= endSlot) {
        const slotEnd = addMinutes(currentSlot, serviceDuration);
        const technicalBreakStart = subMinutes(
          currentSlot,
          service.technicalBreakMin,
        );
        const technicalBreakEnd = currentSlot;

        const isBlocked = busyBlocks.some((busy) => {
          return (
            (technicalBreakStart < busy.end &&
              technicalBreakEnd > busy.start) ||
            (currentSlot < busy.end && slotEnd > busy.start)
          );
        });

        if (!isBlocked) {
          availableSlots.push(new Date(currentSlot));
        }

        currentSlot = addMinutes(currentSlot, slotStep);
      }
    });

    return availableSlots;
  }

  private getBusyBlocksForDay(
    date: Date,
    reservations: Prisma.ReservationGetPayload<{
      include: { service: true };
    }>[],
  ): WorkingBlock[] {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return reservations
      .filter((reservation) => {
        const resDate = new Date(reservation.startTime);
        return resDate >= dayStart && resDate <= dayEnd;
      })
      .map((reservation) => ({
        start: subMinutes(
          reservation.startTime,
          reservation.service.technicalBreakMin,
        ),
        end: addMinutes(
          reservation.startTime,
          reservation.service.durationMin +
            reservation.service.breakAfterServiceMin,
        ),
      }));
  }

  private formatSlots(slots: Date[], service: Service): TimeSlotDto[] {
    return slots.map((slot) => {
      const endTime = addMinutes(
        slot,
        service.durationMin + service.technicalBreakMin,
      );
      return new TimeSlotDto({
        startTime: slot.toLocaleTimeString('pl-PL', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
        endTime: endTime.toLocaleTimeString('pl-PL', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
        value: slot,
      });
    });
  }
}
