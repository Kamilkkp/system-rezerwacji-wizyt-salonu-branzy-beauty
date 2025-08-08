import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import {
  InjectTransaction,
  Transaction,
  Transactional,
} from '@nestjs-cls/transactional';
import { UUID } from 'crypto';
import { PromotionStatus, PromotionType } from '@prisma/client';
import { PromotionDto } from './dto/promotion.dto';
import { ItemDto } from '@root/libs/api/item.dto';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
  ) {}

  @Transactional()
  async create(ownerId: UUID, salonId: UUID, payload: CreatePromotionDto) {
    await this.validateOwnerAndSalon(ownerId, salonId);
    await this.validatePromotionEntities(
      salonId,
      payload.serviceGroupIds,
      payload.serviceIds,
    );

    const { serviceGroupIds, serviceIds, ...promotionData } = payload;

    const result = await this.tx.promotion.create({
      data: {
        ...promotionData,
        salonId,
        serviceGroups: serviceGroupIds
          ? {
              connect: serviceGroupIds.map((id) => ({ id })),
            }
          : undefined,
        services: serviceIds
          ? {
              connect: serviceIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        services: { select: { id: true, name: true } },
        serviceGroups: { select: { id: true, name: true } },
      },
    });

    return new PromotionDto({
      ...result,
      value: result.value.toNumber(),
      serviceGroups: result.serviceGroups.map((v) => new ItemDto(v)),
      services: result.services.map((v) => new ItemDto(v)),
    });
  }

  async findAll(
    ownerId: UUID,
    salonId: UUID,
    status: PromotionStatus,
    types: PromotionType[],
  ) {
    const result = await this.tx.promotion.findMany({
      select: { id: true, name: true },
      where: { salonId, salon: { ownerId }, status, type: { in: types } },
    });

    return result.map((v) => new ItemDto(v));
  }

  async findOne(ownerId: UUID, id: UUID) {
    const result = await this.tx.promotion.findUnique({
      where: { salon: { ownerId }, id },
      include: {
        serviceGroups: { select: { id: true, name: true } },
        services: { select: { id: true, name: true } },
      },
    });

    if (!result) {
      throw new NotFoundException();
    }

    return new PromotionDto({
      ...result,
      serviceGroups: result.serviceGroups.map((v) => new ItemDto(v)),
      services: result.services.map((v) => new ItemDto(v)),
      value: result.value.toNumber(),
    });
  }

  @Transactional()
  async update(
    ownerId: UUID,
    salonId: UUID,
    id: UUID,
    data: UpdatePromotionDto,
  ) {
    await this.validatePromotionEntities(
      salonId,
      data.serviceGroupIds,
      data.serviceIds,
    );

    const { serviceGroupIds, serviceIds, ...updateData } = data;

    const result = await this.tx.promotion.update({
      data: {
        ...updateData,
        serviceGroups: serviceGroupIds
          ? {
              set: serviceGroupIds.map((id) => ({ id })),
            }
          : undefined,
        services: serviceIds
          ? {
              set: serviceIds.map((id) => ({ id })),
            }
          : undefined,
      },
      where: { id, salon: { ownerId } },
      include: {
        services: { select: { id: true, name: true } },
        serviceGroups: { select: { id: true, name: true } },
      },
    });

    return new PromotionDto({
      ...result,
      value: result.value.toNumber(),
      serviceGroups: result.serviceGroups.map((v) => new ItemDto(v)),
      services: result.services.map((v) => new ItemDto(v)),
    });
  }

  @Transactional()
  async remove(ownerId: UUID, id: UUID) {
    await this.tx.promotion.delete({ where: { salon: { ownerId }, id } });
  }

  private async validateOwnerAndSalon(ownerId: UUID, salonId: UUID) {
    const result = await this.tx.salon.findUnique({
      select: { id: true },
      where: {
        ownerId,
        id: salonId,
      },
    });

    if (!result) {
      throw new BadRequestException(
        `Salon with ID "${salonId}" not found or does not belong to owner "${ownerId}".`,
      );
    }
  }

  private async validatePromotionEntities(
    salonId: UUID,
    serviceGroupIds?: UUID[],
    serviceIds?: UUID[],
  ): Promise<void> {
    if (serviceGroupIds && serviceGroupIds.length > 0) {
      const count = await this.tx.serviceGroup.count({
        where: {
          id: { in: serviceGroupIds },
          salonId,
        },
      });

      if (count !== serviceGroupIds.length) {
        throw new BadRequestException(
          'One or more service group IDs are invalid or do not belong to this salon.',
        );
      }
    }

    if (serviceIds && serviceIds.length > 0) {
      const count = await this.tx.service.count({
        where: {
          id: { in: serviceIds },
          serviceGroup: {
            salonId,
          },
        },
      });

      if (count !== serviceIds.length) {
        throw new BadRequestException(
          'One or more service IDs are invalid or do not belong to this salon.',
        );
      }
    }
  }
}
