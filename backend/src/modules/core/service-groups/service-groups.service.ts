import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateServiceGroupDto } from './dto/req/create-service-group.dto';
import { UpdateServiceGroupDto } from './dto/req/update-service-group.dto';
import { UUID } from 'crypto';
import {
  InjectTransaction,
  Transaction,
  Transactional,
} from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import {
  Promotion,
  PromotionStatus,
  PromotionType,
  ServiceGroupStatus,
  ServiceStatus,
} from '@prisma/client';
import { ServiceGroupDto, ServiceItemDto } from './dto/res/service-group.dto';
import { ItemDto } from '@root/libs/api/item.dto';

@Injectable()
export class ServiceGroupsService {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
  ) {}

  @Transactional()
  async create(ownerId: UUID, salonId: UUID, payload: CreateServiceGroupDto) {
    await this.validateOwnerAndSalon(ownerId, salonId);

    const result = await this.tx.serviceGroup.create({
      data: {
        ...payload,
        salonId,
      },
    });

    return new ItemDto(result);
  }

  async findAll(salonId: UUID, status: ServiceGroupStatus) {
    const result = await this.tx.serviceGroup.findMany({
      select: { id: true, name: true },
      where: { salonId, status },
    });

    return result.map((v) => new ItemDto(v));
  }

  async findOne(id: UUID, status: ServiceStatus) {
    const now = new Date();
    const activePromotionsFilter = {
      where: {
        startTime: { lte: now },
        OR: [{ endTime: null }, { endTime: { gte: now } }],
        status: PromotionStatus.ACTIVE,
      },
    };

    const result = await this.tx.serviceGroup.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            promotions: activePromotionsFilter,
          },
          where: { status },
        },
        promotions: activePromotionsFilter,
      },
    });

    if (!result) {
      throw new NotFoundException();
    }

    return new ServiceGroupDto({
      ...result,
      services: result.services.map((service) => {
        const availableDiscounts = [
          ...result.promotions,
          ...service.promotions,
        ];
        const promo = this.getBestDiscountAndPriceForService(
          service.price.toNumber(),
          availableDiscounts,
        );

        return new ServiceItemDto({
          ...service,
          ...promo,
          price: service.price.toNumber(),
        });
      }),
    });
  }

  @Transactional()
  async update(
    ownerId: UUID,
    salonId: UUID,
    id: UUID,
    data: UpdateServiceGroupDto,
  ) {
    await this.validateOwnerAndSalon(ownerId, salonId);

    await this.tx.serviceGroup.update({
      where: { salonId, id },
      data,
    });

    return this.findOne(id, ServiceStatus.ACTIVE);
  }

  @Transactional()
  async remove(ownerId: UUID, salonId: UUID, id: UUID) {
    await this.validateOwnerAndSalon(ownerId, salonId);

    await this.tx.serviceGroup.delete({ where: { id } });
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

  private getBestDiscountAndPriceForService(
    basePrice: number,
    promotions: Promotion[],
  ) {
    if (promotions.length === 0) {
      return;
    }

    let finalPromotion: Promotion;
    let priceAfterDiscount = basePrice;

    promotions.forEach((v) => {
      const promoPrice =
        v.type === PromotionType.FIXED_AMOUNT
          ? basePrice - v.value.toNumber()
          : basePrice * ((100 - v.value.toNumber()) / 100);

      if (!finalPromotion || promoPrice < priceAfterDiscount) {
        finalPromotion = v;
        priceAfterDiscount = promoPrice;
      }
    });

    return {
      promotionId: finalPromotion!.id,
      priceAfterDiscount,
      discount:
        finalPromotion!.type === PromotionType.FIXED_AMOUNT
          ? `-${finalPromotion!.value.toNumber()}zł`
          : `-${finalPromotion!.value.toNumber()}%`,
    };
  }
}
