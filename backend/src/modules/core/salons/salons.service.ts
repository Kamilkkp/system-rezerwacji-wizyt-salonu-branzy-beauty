import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSalonDto } from './dto/req/create-salon.dto';
import { UpdateSalonDto } from './dto/req/update-salon.dto';
import { UUID } from 'crypto';
import {
  InjectTransaction,
  Transaction,
  Transactional,
} from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Prisma } from '@prisma/client';
import { SalonItemDto } from './dto/res/salon-item.dto';
import {
  AddressDto,
  ContactInfoDto,
  OpenHoursDto,
  SalonDto,
} from './dto/res/salon.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SalonFrontendUrlUpdatedEvent } from './events/salon-frontend-url-updated.event';
import { SalonWithFrontendUrlDeletedEvent } from './events/salon-with-frontend-url-deleted.event';

type salonWithDetailsArgs = {
  include: {
    address: true;
    contactInfo: true;
    openHours: true;
  };
};

type SalonWithDetails = Prisma.SalonGetPayload<salonWithDetailsArgs>;

@Injectable()
export class SalonsService {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Transactional()
  async create(ownerId: UUID, payload: CreateSalonDto) {
    const result = await this.tx.salon.create({
      data: {
        ...payload,
        ownerId,
      },
    });

    return result.id;
  }

  async findAll(ownerId: UUID) {
    const salons = await this.tx.salon.findMany({
      select: {
        id: true,
        name: true,
        address: {
          select: {
            city: true,
          },
        },
      },
      where: {
        ownerId,
      },
    });

    return salons.map(
      (salon) => new SalonItemDto({ ...salon, city: salon.address?.city }),
    );
  }

  async findOne(id: UUID) {
    const result = await this.tx.salon.findUnique({
      where: {
        id,
      },
      include: {
        address: true,
        contactInfo: true,
        openHours: true,
      },
    });

    if (!result) {
      throw new NotFoundException();
    }

    return this.getDto(result);
  }

  @Transactional()
  async update(ownerId: UUID, salonId: UUID, updateSalonDto: UpdateSalonDto) {
    const { address, contactInfo, openHours, ...salonData } = updateSalonDto;

    const isFrontendUrlUpdated = 'frontendUrl' in salonData;

    const updatePayload: Prisma.SalonUpdateInput = {
      ...salonData,
    };

    if (openHours) {
      openHours.forEach((oh) => {
        if (oh.open >= oh.close) {
          throw new BadRequestException(
            `For day ${oh.dayOfWeek}, the closing time (${oh.close}) must be after the opening time (${oh.open}).`,
          );
        }
      });

      await this.tx.openHours.deleteMany({
        where: { salonId },
      });

      if (openHours.length > 0) {
        await this.tx.openHours.createMany({
          data: openHours.map((oh) => {
            return {
              ...oh,
              salonId,
            };
          }),
        });
      }
    }

    if (contactInfo) {
      updatePayload.contactInfo = {
        upsert: {
          create: contactInfo,
          update: contactInfo,
        },
      };
    }

    if (address) {
      updatePayload.address = {
        upsert: {
          create: address,
          update: address,
        },
      };
    }

    try {
      const result = await this.tx.salon.update({
        where: { id: salonId, ownerId },
        data: updatePayload,
        include: {
          address: true,
          contactInfo: true,
          openHours: true,
        },
      });

      if (isFrontendUrlUpdated) {
        await this.eventEmitter.emitAsync(
          SalonFrontendUrlUpdatedEvent.name,
          new SalonFrontendUrlUpdatedEvent(salonId),
        );
      }

      return this.getDto(result);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new BadRequestException(
          `Salon with ID "${salonId}" for owner ID "${ownerId}" not found.`,
        );
      }
      throw error;
    }
  }

  @Transactional()
  async remove(ownerId: UUID, salonId: UUID) {
    const salon = await this.tx.salon.findUnique({
      where: { id: salonId, ownerId },
      select: { frontendUrl: true },
    });

    await this.tx.salon.delete({
      where: { id: salonId, ownerId },
    });

    if (salon?.frontendUrl) {
      await this.eventEmitter.emitAsync(
        SalonWithFrontendUrlDeletedEvent.name,
        new SalonWithFrontendUrlDeletedEvent(salonId),
      );
    }
  }

  private getDto({
    address,
    contactInfo,
    openHours,
    ...rest
  }: SalonWithDetails) {
    return new SalonDto({
      ...rest,
      address: address ? new AddressDto(address) : null,
      contactInfo: contactInfo ? new ContactInfoDto(contactInfo) : null,
      openHours: openHours ? openHours.map((v) => new OpenHoursDto(v)) : [],
    });
  }
}
