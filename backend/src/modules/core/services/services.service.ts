import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UUID } from 'crypto';
import { ServiceStatus } from '@prisma/client';
import {
  InjectTransaction,
  Transaction,
  Transactional,
} from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { ServiceDto } from './dto/service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
  ) {}

  @Transactional()
  async create(
    ownerId: UUID,
    salonId: UUID,
    serviceGroupId: UUID,
    payload: CreateServiceDto,
  ) {
    await this.validateOwnerAndGroup(ownerId, salonId, serviceGroupId);

    const result = await this.tx.service.create({
      data: { ...payload, serviceGroupId },
    });

    return new ServiceDto({ ...result, price: result.price.toNumber() });
  }

  async findAll(ownerId: UUID, serviceGroupId: UUID, status?: ServiceStatus) {
    const result = await this.tx.service.findMany({
      where: {
        serviceGroup: {
          id: serviceGroupId,
          salon: {
            ownerId,
          },
        },
        status,
      },
    });

    return result.map(
      (v) => new ServiceDto({ ...v, price: v.price.toNumber() }),
    );
  }

  async findOne(id: UUID) {
    const result = await this.tx.service.findUnique({
      where: {
        id,
      },
    });

    if (!result) {
      throw new BadRequestException(`Service with ID "${id}" not found.`);
    }

    return new ServiceDto({ ...result, price: result.price.toNumber() });
  }

  @Transactional()
  async update(
    ownerId: UUID,
    salonId: UUID,
    serviceGroupId: UUID,
    id: UUID,
    data: UpdateServiceDto,
  ) {
    await this.validateOwnerAndGroup(ownerId, salonId, serviceGroupId);

    const result = await this.tx.service.update({
      where: { id, serviceGroupId },
      data,
    });

    return new ServiceDto({ ...result, price: result.price.toNumber() });
  }

  @Transactional()
  async remove(ownerId: UUID, salonId: UUID, serviceGroupId: UUID, id: UUID) {
    await this.validateOwnerAndGroup(ownerId, salonId, serviceGroupId);

    await this.tx.service.delete({
      where: { id, serviceGroupId },
    });
  }

  private async validateOwnerAndGroup(
    ownerId: UUID,
    salonId: UUID,
    serviceGroupId: UUID,
  ) {
    const result = await this.tx.serviceGroup.findUnique({
      select: { id: true },
      where: {
        id: serviceGroupId,
        salon: {
          id: salonId,
          ownerId,
        },
      },
    });

    if (!result) {
      throw new BadRequestException(
        `Group with ID "${serviceGroupId}" not found or does not belong to owner "${ownerId}".`,
      );
    }
  }
}
