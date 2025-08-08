import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UUID } from 'crypto';
import {
  ReservationStatus,
  Prisma,
  PromotionStatus,
  PromotionType,
} from '@prisma/client';
import { addMinutes, isBefore, subMinutes } from 'date-fns';
import {
  InjectTransaction,
  Transaction,
  Transactional,
} from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { PromotionDto, ReservationDto } from './dto/reservation.dto';
import { ReservationWithDetails } from './types/reservation-with-details.type';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NewReservationEvent } from './events/new-reservation.event';
import { ReservationCancelledEvent } from './events/reservation-cancelled.event';
import { ReservationConfirmedEvent } from './events/reservation-confirmed.event';
import { ReservationTimeChangedEvent } from './events/reservation-time-changed.event';
import { ReservationCompletedEvent } from './events/reservation-completed.event';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Transactional()
  async create(salonId: UUID, createReservationDto: CreateReservationDto) {
    const { serviceId, startTime, promotionId, ...reservationData } =
      createReservationDto;

    const service = await this.tx.service.findUnique({
      where: { id: serviceId, serviceGroup: { salonId } },
      include: { serviceGroup: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    let finalPrice = service.price;

    if (promotionId) {
      finalPrice = await this.applyPromotionIfValid(
        salonId,
        promotionId,
        service.price,
      );
    }

    await this.checkTimeSlotAvailability(
      salonId,
      serviceId,
      new Date(startTime),
    );

    const result = await this.tx.reservation.create({
      data: {
        ...reservationData,
        startTime: new Date(startTime),
        serviceId,
        promotionId,
        price: finalPrice,
        status: ReservationStatus.PENDING,
      },
      include: {
        service: {
          include: {
            serviceGroup: {
              include: {
                salon: true,
              },
            },
          },
        },
        Promotion: true,
      },
    });

    await this.eventEmitter.emitAsync(
      NewReservationEvent.name,
      new NewReservationEvent(result.id as UUID),
    );

    return this.mapToReservationDto(result);
  }

  async findOne(id: UUID) {
    const result = await this.tx.reservation.findUnique({
      where: { id },
      include: {
        service: {
          include: {
            serviceGroup: {
              include: {
                salon: true,
              },
            },
          },
        },
        Promotion: true,
      },
    });

    if (!result) {
      throw new NotFoundException('Reservation not found');
    }

    return this.mapToReservationDto(result);
  }

  async findAllForSalon(
    salonId: UUID,
    status?: ReservationStatus,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: Prisma.ReservationWhereInput = {
      service: {
        serviceGroup: {
          salonId,
        },
      },
    };

    if (status) {
      where.status = status;
    } else {
      where.status = { not: ReservationStatus.CANCELLED };
      where.startTime = { gte: new Date() };
    }

    if (startDate) {
      where.startTime = {
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      where.startTime = {
        lte: new Date(endDate),
      };
    }

    const reservations = await this.tx.reservation.findMany({
      where,
      include: {
        service: {
          include: {
            serviceGroup: {
              include: {
                salon: {
                  include: {
                    address: true,
                  },
                },
              },
            },
          },
        },
        Promotion: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return reservations.map((res) => this.mapToReservationDto(res));
  }

  @Transactional()
  async cancelReservation(id: UUID) {
    const result = await this.tx.reservation.update({
      where: { id },
      data: { status: ReservationStatus.CANCELLED },
    });

    await this.eventEmitter.emitAsync(
      ReservationCancelledEvent.name,
      new ReservationCancelledEvent(result.id as UUID),
    );
  }

  @Transactional()
  async confirmReservation(ownerId: UUID, id: UUID) {
    const reservation = await this.tx.reservation.findUnique({
      where: { id, service: { serviceGroup: { salon: { ownerId } } } },
      include: {
        service: {
          include: {
            serviceGroup: {
              include: {
                salon: true,
              },
            },
          },
        },
        Promotion: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException(
        'Only pending reservations can be confirmed',
      );
    }

    await this.tx.reservation.update({
      where: { id },
      data: { status: ReservationStatus.CONFIRMED },
    });

    await this.eventEmitter.emitAsync(
      ReservationConfirmedEvent.name,
      new ReservationConfirmedEvent(reservation.id as UUID),
    );
  }

  async completeReservation(ownerId: UUID, id: UUID) {
    const reservation = await this.tx.reservation.findUnique({
      where: { id, service: { serviceGroup: { salon: { ownerId } } } },
      include: {
        service: {
          include: {
            serviceGroup: {
              include: {
                salon: true,
              },
            },
          },
        },
        Promotion: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestException(
        'Only confirmed reservations can be completed',
      );
    }

    if (isBefore(new Date(), reservation.startTime)) {
      throw new BadRequestException(
        'Cannot complete reservation before its start time',
      );
    }

    await this.tx.reservation.update({
      where: { id },
      data: { status: ReservationStatus.COMPLETED },
    });

    await this.eventEmitter.emitAsync(
      ReservationCompletedEvent.name,
      new ReservationCompletedEvent(reservation.id as UUID),
    );
  }

  @Transactional()
  async changeReservationTime(
    salonId: UUID,
    reservationId: UUID,
    newStartTime: Date,
    status?: ReservationStatus,
  ): Promise<ReservationDto> {
    const existingReservation = await this.tx.reservation.findUnique({
      where: { id: reservationId, service: { serviceGroup: { salonId } } },
    });

    if (!existingReservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (existingReservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot change time for cancelled reservation',
      );
    }

    if (existingReservation.status === ReservationStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot change time for completed reservation',
      );
    }

    await this.checkTimeSlotAvailability(
      salonId,
      existingReservation.serviceId as UUID,
      newStartTime,
      existingReservation.id as UUID,
    );

    const updated = await this.tx.reservation.update({
      where: { id: reservationId },
      data: { startTime: newStartTime, status },
      include: {
        service: {
          include: {
            serviceGroup: {
              include: {
                salon: true,
              },
            },
          },
        },
        Promotion: true,
      },
    });

    await this.eventEmitter.emitAsync(
      ReservationTimeChangedEvent.name,
      new ReservationTimeChangedEvent(reservationId, newStartTime),
    );

    return this.mapToReservationDto(updated);
  }

  private async applyPromotionIfValid(
    salonId: UUID,
    promotionId: UUID,
    originalPrice: Prisma.Decimal,
  ): Promise<Prisma.Decimal> {
    const now = new Date();
    const promotion = await this.tx.promotion.findUnique({
      where: {
        id: promotionId,
        salonId,
        status: PromotionStatus.ACTIVE,
        startTime: { lte: now },
        OR: [{ endTime: { gte: now } }, { endTime: null }],
      },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    return this.applyPromotion(originalPrice, promotion);
  }

  private applyPromotion(
    originalPrice: Prisma.Decimal,
    promotion: { type: string; value: Prisma.Decimal },
  ): Prisma.Decimal {
    if (promotion.type === PromotionType.FIXED_AMOUNT) {
      return new Prisma.Decimal(
        Math.max(0, originalPrice.toNumber() - promotion.value.toNumber()),
      );
    } else {
      const discount =
        originalPrice.toNumber() * (promotion.value.toNumber() / 100);
      return new Prisma.Decimal(
        Math.max(0, originalPrice.toNumber() - discount),
      );
    }
  }

  private async checkTimeSlotAvailability(
    salonId: UUID,
    serviceId: UUID,
    startTime: Date,
    excludeReservationId?: UUID,
  ): Promise<void> {
    const service = await this.tx.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const newStartTime = new Date(startTime);
    const newEndTime = addMinutes(
      newStartTime,
      service.durationMin + service.breakAfterServiceMin,
    );

    const conflictingReservation = await this.tx.reservation.findFirst({
      where: {
        service: {
          serviceGroup: {
            salonId,
          },
        },
        NOT: {
          id: excludeReservationId,
        },
        status: {
          not: ReservationStatus.CANCELLED,
        },
        OR: [
          {
            startTime: {
              lt: newEndTime,
            },
            AND: {
              startTime: {
                gt: subMinutes(
                  newStartTime,
                  service.durationMin + service.breakAfterServiceMin,
                ),
              },
            },
          },
          {
            startTime: {
              equals: newStartTime,
            },
          },
          {
            startTime: {
              gt: newEndTime,
            },
            AND: {
              startTime: {
                lt: addMinutes(newEndTime, service.technicalBreakMin),
              },
            },
          },
        ],
      },
    });

    if (conflictingReservation) {
      throw new ConflictException('Time slot already booked');
    }
  }

  private mapToReservationDto(
    reservation: ReservationWithDetails,
  ): ReservationDto {
    return new ReservationDto({
      ...reservation,
      salonName: reservation.service.serviceGroup.salon.name,
      serviceName: reservation.service.name,
      endTime: addMinutes(
        reservation.startTime,
        reservation.service.durationMin,
      ),
      price: reservation.price.toNumber(),
      promotion: reservation.Promotion
        ? new PromotionDto({
            ...reservation.Promotion,
            value: reservation.Promotion.value.toNumber(),
          })
        : undefined,
    });
  }
}
