import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as ics from 'ics';
import { Response } from 'express';
import { UUID } from 'crypto';
import { ReservationsService } from '../reservations/reservations.service';
import { ReservationStatus } from '@prisma/client';
import { ReservationDto } from '../reservations/dto/reservation.dto';
import { SalonsService } from '../salons/salons.service';
import { SalonDto } from '../salons/dto/res/salon.dto';
import { InjectTransaction, Transaction } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

@Injectable()
export class CalendarExportService {
  private readonly logger: Logger;

  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly salonsService: SalonsService,
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
  ) {
    this.logger = new Logger(CalendarExportService.name);
  }

  async exportSingleToIcs(
    salonId: UUID,
    reservationId: UUID,
    res: Response,
  ): Promise<void> {
    const reservation = await this.reservationsService.findOne(reservationId);
    const salon = await this.salonsService.findOne(salonId);
    const event = this.prepareIcsEvent(reservation, salon);

    await this.sendIcsResponse(res, event);
  }

  async exportMultipleToIcs(
    salonId: UUID,
    calendarId: UUID,
    res: Response,
  ): Promise<void> {
    const salonWithCalendarId = await this.tx.salon.findFirst({
      where: { id: salonId, calendarId },
    });

    if (!salonWithCalendarId) {
      throw new NotFoundException('Invalid salonId or calendarId');
    }

    const reservations =
      await this.reservationsService.findAllForSalon(salonId);

    if (reservations.length === 0) {
      res.status(204).send();
      return;
    }

    const salon = await this.salonsService.findOne(salonId);

    const events = reservations.map((reservation) =>
      this.prepareIcsEvent(reservation, salon),
    );
    await this.sendIcsResponse(res, events);
  }

  prepareIcsEvent(
    reservation: ReservationDto,
    salon: SalonDto,
  ): ics.EventAttributes {
    const reservationUrl = `${salon.frontendUrl}/reservation/${reservation.id}`;
    const toDateArray = (date: Date): ics.DateArray => [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
    ];

    return {
      uid: reservation.id,
      title: `${salon.name} - ${reservation.serviceName}`,
      description: `Link to reservation details: ${reservationUrl}`,
      start: toDateArray(reservation.startTime),
      end: toDateArray(reservation.endTime),
      location: salon.address
        ? `${salon.address.streetName} ${salon.address.streetNumber || ''} ${salon.address.apartment || ''}, ${salon.address.city || ''}`
        : salon.name,
      status: this.mapReservationStatusToIcsStatus(reservation.status),
      startInputType: 'utc',
      startOutputType: 'utc',
      organizer: {
        name: salon.name,
        email: salon.contactInfo?.email,
      },
    };
  }

  private async sendIcsResponse(
    res: Response,
    events: ics.EventAttributes | ics.EventAttributes[],
  ): Promise<void> {
    try {
      let icsContent: string;

      if (Array.isArray(events)) {
        icsContent = await this.createIcsEvents(events);
      } else {
        icsContent = await this.createIcsEvent(events);
      }

      res
        .setHeader('Content-Type', 'text/calendar; charset=utf-8')
        .setHeader('Content-Disposition', 'inline; filename="reservations.ics"')
        .setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        .setHeader('Pragma', 'no-cache')
        .setHeader('Expires', '0')
        .send(this.wrapWithCalendarHeaders(icsContent));
    } catch (error: unknown) {
      this.logger.error('Failed to generate ICS file', {
        error,
        events: Array.isArray(events) ? events.length : 1,
      });
      throw new InternalServerErrorException(
        'Could not generate calendar file. Please check the reservation data.',
      );
    }
  }

  private mapReservationStatusToIcsStatus(
    status: ReservationStatus,
  ): ics.EventStatus | undefined {
    switch (status) {
      case 'CONFIRMED':
        return 'CONFIRMED';
      case 'CANCELLED':
        return 'CANCELLED';
      case 'COMPLETED':
        return 'CONFIRMED';
      case 'PENDING':
        return 'TENTATIVE';
      default:
        return undefined;
    }
  }

  private wrapWithCalendarHeaders(eventsContent: string) {
    return `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SalonBooking//EN
METHOD:PUBLISH
CALSCALE:GREGORIAN
X-WR-CALNAME:Rezerwacje Salonu
X-WR-TIMEZONE:Europe/Warsaw
${eventsContent.replace('BEGIN:VCALENDAR', '').replace('END:VCALENDAR', '')}
END:VCALENDAR
  `.trim();
  }
  private async createIcsEvent(event: ics.EventAttributes): Promise<string> {
    return new Promise((resolve, reject) => {
      ics.createEvent(event, (error, value) => {
        if (error || !value) {
          reject(error || new Error('ICS generation failed'));
        } else {
          resolve(value);
        }
      });
    });
  }

  private async createIcsEvents(
    events: ics.EventAttributes[],
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      ics.createEvents(events, (error, value) => {
        if (error || !value) {
          reject(error || new Error('ICS generation failed'));
        } else {
          resolve(value);
        }
      });
    });
  }
}
