import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  ClassSerializerInterceptor,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@root/libs/decorators/auth-user.decorator';
import { JwtAuthGuard } from '@root/libs/guards/jwt-auth.guard';
import { UserPayload } from '@root/libs/interfaces/user-payload.interface';
import { ChangeTimeReservationDto } from '@root/modules/core/reservations/dto/change-time-reservation.dto';
import { CreateReservationDto } from '@root/modules/core/reservations/dto/create-reservation.dto';
import { FindReservationsQueryDto } from '@root/modules/core/reservations/dto/find-reservations.query.dto';
import { FindSlotsQueryDto } from '@root/modules/core/reservations/dto/find-slots.query.dto';
import { ReservationsService } from '@root/modules/core/reservations/reservations.service';
import { AvailableSlotsService } from '@root/modules/core/reservations/available-slots.service';
import { UUID } from 'crypto';

@ApiTags('BMS Reservations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('bms/salons/:salonId/reservations')
@UseInterceptors(ClassSerializerInterceptor)
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly availableSlotsService: AvailableSlotsService,
  ) {}

  @Get()
  async findAll(
    @Param('salonId') salonId: UUID,
    @Query() { startDate, endDate, status }: FindReservationsQueryDto,
  ) {
    return this.reservationsService.findAllForSalon(
      salonId,
      status,
      startDate,
      endDate,
    );
  }

  @Get('available-slots')
  async findAvailableSlots(
    @Param('salonId') salonId: UUID,
    @Query() query: FindSlotsQueryDto,
  ) {
    return this.availableSlotsService.findAvailableSlotsInRange(
      salonId,
      query.serviceId,
      query.startDate,
      query.endDate,
    );
  }

  @Get(':id')
  async findOne(@Param('salonId') salonId: UUID, @Param('id') id: UUID) {
    return this.reservationsService.findOne(id);
  }

  @Post()
  async create(
    @Param('salonId') salonId: UUID,
    @Body() createReservationDto: CreateReservationDto,
  ) {
    return this.reservationsService.create(salonId, createReservationDto);
  }

  @Post(':id/change-time')
  async changeReservationTime(
    @Param('salonId') salonId: UUID,
    @Param('id') id: UUID,
    @Body() body: ChangeTimeReservationDto,
  ) {
    return this.reservationsService.changeReservationTime(
      salonId,
      id,
      body.startTime,
    );
  }

  @Post(':id/confirm')
  async confirmReservation(
    @AuthUser() user: UserPayload,
    @Param('salonId') salonId: UUID,
    @Param('id') id: UUID,
  ) {
    return this.reservationsService.confirmReservation(user.id, id);
  }

  @Post(':id/complete')
  async completeReservation(
    @AuthUser() user: UserPayload,
    @Param('salonId') salonId: UUID,
    @Param('id') id: UUID,
  ) {
    return this.reservationsService.completeReservation(user.id, id);
  }

  @Post(':id/cancel')
  async cancelReservation(
    @Param('salonId') salonId: UUID,
    @Param('id') id: UUID,
  ) {
    return this.reservationsService.cancelReservation(id);
  }
}
