import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PromotionsService } from '../../core/promotions/promotions.service';
import { CreatePromotionDto } from '../../core/promotions/dto/create-promotion.dto';
import { UpdatePromotionDto } from '../../core/promotions/dto/update-promotion.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@root/libs/guards/jwt-auth.guard';
import { UUID } from 'crypto';
import { AuthUser } from '@root/libs/decorators/auth-user.decorator';
import { UserPayload } from '@root/libs/interfaces/user-payload.interface';
import { FindAllPromotionsQueryDto } from '@root/modules/core/promotions/dto/find-all-promotions.query.dto';

@ApiTags('BMS Promotions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('bms/salons/:salonId/promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  create(
    @AuthUser() user: UserPayload,
    @Param('salonId') salonId: UUID,
    @Body() createPromotionDto: CreatePromotionDto,
  ) {
    return this.promotionsService.create(user.id, salonId, createPromotionDto);
  }

  @Get()
  findAll(
    @AuthUser() user: UserPayload,
    @Param('salonId') salonId: UUID,
    @Query() query: FindAllPromotionsQueryDto,
  ) {
    return this.promotionsService.findAll(
      user.id,
      salonId,
      query.status,
      query.type,
    );
  }

  @Get(':id')
  findOne(
    @AuthUser() user: UserPayload,
    @Param('salonId') salonId: UUID,
    @Param('id') id: UUID,
  ) {
    return this.promotionsService.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @AuthUser() user: UserPayload,
    @Param('salonId') salonId: UUID,
    @Param('id') id: UUID,
    @Body() updatePromotionDto: UpdatePromotionDto,
  ) {
    return this.promotionsService.update(
      user.id,
      salonId,
      id,
      updatePromotionDto,
    );
  }

  @Delete(':id')
  remove(
    @AuthUser() user: UserPayload,
    @Param('salonId') salonId: UUID,
    @Param('id') id: UUID,
  ) {
    return this.promotionsService.remove(user.id, id);
  }
}
