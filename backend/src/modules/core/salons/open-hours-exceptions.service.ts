import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  InjectTransaction,
  Transaction,
  Transactional,
} from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Prisma } from '@prisma/client';
import { CreateOpenHoursExceptionDto } from './dto/req/create-open-hours-exception.dto';
import { UpdateOpenHoursExceptionDto } from './dto/req/update-open-hours-exception.dto';
import { OpenHoursExceptionDto } from './dto/res/open-hours-exception.dto';

@Injectable()
export class OpenHoursExceptionsService {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
  ) {}

  @Transactional()
  async create(
    ownerId: string,
    salonId: string,
    payload: CreateOpenHoursExceptionDto,
  ): Promise<OpenHoursExceptionDto> {
    await this.validateOwnerAndSalon(ownerId, salonId);
    this.validateTimeRange(payload.startTime, payload.endTime);
    await this.checkForOverlappingExceptions(
      salonId,
      payload.startTime,
      payload.endTime,
    );

    const result = await this.tx.scheduleOverride.create({
      data: {
        ...payload,
        salonId,
      },
    });

    return new OpenHoursExceptionDto(result);
  }

  async findAll(
    ownerId: string,
    salonId: string,
    startTime?: Date,
    endTime?: Date,
  ): Promise<OpenHoursExceptionDto[]> {
    await this.validateOwnerAndSalon(ownerId, salonId);

    const whereConditions: Prisma.ScheduleOverrideWhereInput = { salonId };

    if (startTime || endTime) {
      whereConditions.AND = [
        {
          OR: [
            startTime && endTime
              ? {
                  startTime: { gte: startTime, lte: endTime },
                }
              : {},
            startTime && endTime
              ? {
                  endTime: { gte: startTime, lte: endTime },
                }
              : {},
            startTime && endTime
              ? {
                  AND: [
                    { startTime: { lte: startTime } },
                    { endTime: { gte: endTime } },
                  ],
                }
              : {},
            startTime && !endTime
              ? {
                  endTime: { gte: startTime },
                }
              : {},
            !startTime && endTime
              ? {
                  startTime: { lte: endTime },
                }
              : {},
          ].filter((condition) => Object.keys(condition).length > 0),
        },
      ];
    }

    const exceptions = await this.tx.scheduleOverride.findMany({
      where: whereConditions,
      orderBy: { startTime: 'asc' },
    });

    return exceptions.map((exception) => new OpenHoursExceptionDto(exception));
  }

  @Transactional()
  async update(
    ownerId: string,
    salonId: string,
    id: string,
    payload: UpdateOpenHoursExceptionDto,
  ): Promise<OpenHoursExceptionDto> {
    await this.validateOwnerAndSalon(ownerId, salonId);
    await this.validateExceptionExists(id, salonId);

    if (payload.startTime || payload.endTime) {
      const existing = await this.tx.scheduleOverride.findUnique({
        where: { id },
      });

      const startTime = payload.startTime ?? existing?.startTime;
      const endTime = payload.endTime ?? existing?.endTime;

      if (startTime && endTime) {
        this.validateTimeRange(startTime, endTime);
        await this.checkForOverlappingExceptions(
          salonId,
          startTime,
          endTime,
          id,
        );
      }
    }

    const result = await this.tx.scheduleOverride.update({
      where: { id },
      data: payload,
    });

    return new OpenHoursExceptionDto(result);
  }

  @Transactional()
  async remove(ownerId: string, salonId: string, id: string): Promise<void> {
    await this.validateOwnerAndSalon(ownerId, salonId);
    await this.validateExceptionExists(id, salonId);

    await this.tx.scheduleOverride.delete({
      where: { id },
    });
  }

  private async validateOwnerAndSalon(
    ownerId: string,
    salonId: string,
  ): Promise<void> {
    const salon = await this.tx.salon.findUnique({
      where: { id: salonId, ownerId },
    });

    if (!salon) {
      throw new NotFoundException(
        `Salon with ID "${salonId}" not found or does not belong to the owner.`,
      );
    }
  }

  private async validateExceptionExists(
    id: string,
    salonId: string,
  ): Promise<void> {
    const exception = await this.tx.scheduleOverride.findUnique({
      where: { id, salonId },
    });

    if (!exception) {
      throw new NotFoundException(
        `Exception with ID "${id}" not found for salon "${salonId}".`,
      );
    }
  }

  private validateTimeRange(startTime: Date, endTime: Date) {
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time.');
    }
  }

  private async checkForOverlappingExceptions(
    salonId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<void> {
    const overlappingConditions: Prisma.ScheduleOverrideWhereInput = {
      salonId,
      OR: [
        { startTime: { lt: endTime }, endTime: { gt: startTime } }, // Overlapping range
        { startTime: { gte: startTime, lte: endTime } }, // Starts within range
        { endTime: { gte: startTime, lte: endTime } }, // Ends within range
      ],
    };

    if (excludeId) {
      overlappingConditions.NOT = { id: excludeId };
    }

    const overlapping = await this.tx.scheduleOverride.findFirst({
      where: overlappingConditions,
    });

    if (overlapping) {
      throw new ConflictException(
        'The specified time range overlaps with an existing exception.',
      );
    }
  }
}
