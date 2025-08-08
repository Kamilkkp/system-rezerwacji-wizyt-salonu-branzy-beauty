import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { SalonsService } from '../core/salons/salons.service';
import { ApiTags } from '@nestjs/swagger';
import { UUID } from 'crypto';
import { ServiceGroupsService } from '../core/service-groups/service-groups.service';
import { ServicesService } from '../core/services/services.service';
import {
  ReservationStatus,
  ServiceGroupStatus,
  ServiceStatus,
} from '@prisma/client';
import { FindSlotsQueryDto } from '../core/reservations/dto/find-slots.query.dto';
import { ReservationsService } from '../core/reservations/reservations.service';
import { AvailableSlotsService } from '../core/reservations/available-slots.service';
import { CalendarExportService } from '../core/calendar/calendar-export.service';
import { ChangeTimeReservationDto } from '../core/reservations/dto/change-time-reservation.dto';
import { Response } from 'express';
import { CreateReservationDto } from '../core/reservations/dto/create-reservation.dto';
import { MailingSystemService } from '../core/mailing-system/mailing-system.service';

@ApiTags('Public API')
@Controller('public/salons/:salonId')
export class PublicController {
  constructor(
    private readonly salonsService: SalonsService,
    private readonly serviceGroupsService: ServiceGroupsService,
    private readonly servicesService: ServicesService,
    private readonly reservationsService: ReservationsService,
    private readonly availableSlotsService: AvailableSlotsService,
    private readonly calendarExportService: CalendarExportService,
    private readonly mailingSystemService: MailingSystemService,
  ) {}
  @Get()
  findSalon(@Param('salonId') salonId: UUID) {
    return this.salonsService.findOne(salonId);
  }

  @Get('service-groups')
  findAllServiceGroups(@Param('salonId') salonId: UUID) {
    return this.serviceGroupsService.findAll(
      salonId,
      ServiceGroupStatus.ACTIVE,
    );
  }

  @Get('service-groups/:id')
  findOneServiceGroup(@Param('id') id: UUID) {
    return this.serviceGroupsService.findOne(id, ServiceStatus.ACTIVE);
  }

  @Get('services/:id')
  findOneService(@Param('id') id: UUID) {
    return this.servicesService.findOne(id);
  }

  @Post('unsubscribe/marketing-emails/:token')
  async unsubscribeMarketEmails(@Param('token') token: UUID) {
    await this.mailingSystemService.unsubscribeFromMarketing(token);
  }

  @Post('unsubscribe/notification-emails/:token')
  async unsubscribeNotificationEmails(@Param('token') token: UUID) {
    await this.mailingSystemService.unsubscribeFromNotifications(token);
  }

  @Post('reservations')
  async create(
    @Param('salonId') salonId: UUID,
    @Body() createReservationDto: CreateReservationDto,
  ) {
    return this.reservationsService.create(salonId, createReservationDto);
  }

  @Get('reservations/available-slots')
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

  @Get('reservations/calendar/:calendarId/ics')
  async exportAllToIcs(
    @Param('salonId') salonId: UUID,
    @Param('calendarId') calendarId: UUID,
    @Res() res: Response,
  ) {
    await this.calendarExportService.exportMultipleToIcs(
      salonId,
      calendarId,
      res,
    );
  }

  @Get('reservations/:id')
  async findReservation(@Param('id') id: UUID) {
    return this.reservationsService.findOne(id);
  }

  @Post('reservations/:id/change-time')
  async changeReservationTime(
    @Param('salonId') salonId: UUID,
    @Param('id') id: UUID,
    @Body() body: ChangeTimeReservationDto,
  ) {
    return this.reservationsService.changeReservationTime(
      salonId,
      id,
      body.startTime,
      ReservationStatus.PENDING,
    );
  }

  @Post('reservations/:id/cancel')
  async cancelReservation(@Param('id') id: UUID) {
    return this.reservationsService.cancelReservation(id);
  }

  @Get('reservations/:id/calendar.ics')
  async exportOneToIcs(
    @Param('salonId') salonId: UUID,
    @Param('id') id: UUID,
    @Res() res: Response,
  ) {
    await this.calendarExportService.exportSingleToIcs(salonId, id, res);
  }
}
