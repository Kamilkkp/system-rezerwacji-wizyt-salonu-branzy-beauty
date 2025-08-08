import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { SendEmailMessageDto } from './dto/send-email-message.dto';
import { NewReservationEvent } from '../reservations/events/new-reservation.event';
import { OnEvent } from '@nestjs/event-emitter';
import { UUID } from 'crypto';
import { ReservationConfirmedEvent } from '../reservations/events/reservation-confirmed.event';
import { ReservationCancelledEvent } from '../reservations/events/reservation-cancelled.event';
import { ReservationCompletedEvent } from '../reservations/events/reservation-completed.event';
import { ReservationTimeChangedEvent } from '../reservations/events/reservation-time-changed.event';
import { InjectTransaction, Transaction } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { MailerService } from '@infrastructure/mailer/mailer-service';
import { EmailTemplates } from '@infrastructure/mailer/mailer.interface';
import { AppConfigService } from '@root/config/app.config.service';
import { SendMessageResponseDto } from './dto/send-message-response.dto';
import {
  REMINDER_EMAILS_QUEUE,
  ReminderEmailJobData,
  SEND_REMINDER_JOB,
} from './processors/reminder-email.processor';
import { subMinutes } from 'date-fns';
import { ReservationStatus } from '@prisma/client';

@Injectable()
export class MailingSystemService {
  private readonly logger: Logger;

  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
    private readonly mailerService: MailerService,
    private readonly appConfig: AppConfigService,
    @InjectQueue(REMINDER_EMAILS_QUEUE)
    private readonly reminderQueue: Queue<ReminderEmailJobData>,
  ) {
    this.logger = new Logger(MailingSystemService.name);
  }

  async sendMessage(
    ownerId: UUID,
    salonId: UUID,
    createMailingSystemDto: SendEmailMessageDto,
  ) {
    const salon = await this.tx.salon.findUnique({
      where: { id: salonId, ownerId },
      include: {
        address: true,
        contactInfo: true,
      },
    });

    if (!salon) {
      throw new NotFoundException('Salon not found');
    }

    const clients = await this.tx.reservation.findMany({
      where: {
        service: {
          serviceGroup: {
            salon: { id: salonId, ownerId },
          },
        },
        marketingConsent: true,
      },
      select: {
        clientEmail: true,
        id: true,
      },
      distinct: ['clientEmail'],
    });

    if (clients.length === 0) {
      return {
        message: 'No clients with marketing consent found for this salon',
        sentCount: 0,
      };
    }

    const sendEmailPromises = clients.map(async (client) => {
      try {
        await this.mailerService.sendMail({
          to: client.clientEmail,
          from: this.appConfig.appServiceEmail,
          subject: createMailingSystemDto.subject,
          template: EmailTemplates.CUSTOM_MARKETING,
          payload: {
            content: createMailingSystemDto.content,
            salon,
            unsubscribeLink: `${salon.frontendUrl}/unsubscribe-marketing?token=${client.id}`,
          },
        });
        return true;
      } catch (e: unknown) {
        this.logger.error(`Failed to send email to ${client.clientEmail}:`, e);
        return false;
      }
    });

    const results = await Promise.all(sendEmailPromises);
    const sentCount = results.filter((success) => success).length;

    return new SendMessageResponseDto({
      message: `Marketing emails sent to ${sentCount} clients`,
      sentCount,
      totalClients: clients.length,
    });
  }

  async unsubscribeFromMarketing(token: UUID): Promise<boolean> {
    const reservation = await this.tx.reservation.findUnique({
      where: { id: token },
      select: {
        clientEmail: true,
        service: { select: { serviceGroup: { select: { salonId: true } } } },
      },
    });

    if (!reservation) {
      return false;
    }

    await this.tx.reservation.updateMany({
      where: {
        clientEmail: reservation.clientEmail,
        service: {
          serviceGroup: { salonId: reservation.service.serviceGroup.salonId },
        },
      },
      data: {
        marketingConsent: false,
      },
    });

    return true;
  }

  async unsubscribeFromNotifications(token: UUID): Promise<boolean> {
    const reservation = await this.tx.reservation.findUnique({
      where: { id: token },
      select: {
        clientEmail: true,
        service: { select: { serviceGroup: { select: { salonId: true } } } },
      },
    });

    if (!reservation) {
      return false;
    }

    await this.tx.reservation.updateMany({
      where: {
        clientEmail: reservation.clientEmail,
        service: {
          serviceGroup: { salonId: reservation.service.serviceGroup.salonId },
        },
      },
      data: {
        notificationsConsent: false,
      },
    });

    return true;
  }

  @OnEvent(NewReservationEvent.name, { suppressErrors: true })
  private async newReservationSubscriber(payload: NewReservationEvent) {
    const details = await this.getReservationDetails(payload.reservationId);

    if (!details || !details.notificationsConsent) return;

    await this.mailerService.sendMail({
      to: details.clientEmail,
      from: this.appConfig.appServiceEmail,
      subject: `Nowa rezerwacja w ${details.service.serviceGroup.salon.name}`,
      template: EmailTemplates.NEW_RESERVATION,
      payload: {
        ...details,
        unsubscribeLink: `${details.service.serviceGroup.salon.frontendUrl}/unsubscribe-notifications?token=${details.id}`,
        reservationDetailsLink: `${details.service.serviceGroup.salon.frontendUrl}/reservation/${details.id}`,
        salon: details.service.serviceGroup.salon,
      },
    });
  }

  @OnEvent(ReservationConfirmedEvent.name, { suppressErrors: true })
  private async reservationConfirmedSubscriber(
    payload: ReservationConfirmedEvent,
  ) {
    const details = await this.getReservationDetails(payload.reservationId);

    if (!details || !details.notificationsConsent) return;

    await this.mailerService.sendMail({
      to: details.clientEmail,
      from: this.appConfig.appServiceEmail,
      subject: `Potwierdzenie rezerwacji w ${details.service.serviceGroup.salon.name}`,
      template: EmailTemplates.RESERVATION_CONFIRMED,
      payload: {
        ...details,
        unsubscribeLink: `${details.service.serviceGroup.salon.frontendUrl}/unsubscribe-notifications?token=${details.id}`,
        icsDownloadLink: `${this.appConfig.apiUrl}/public/salons/${details.service.serviceGroup.salonId}/reservations/${details.id}/calendar.ics`,
        reservationDetailsLink: `${details.service.serviceGroup.salon.frontendUrl}/reservation/${details.id}`,
        salon: details.service.serviceGroup.salon,
      },
    });

    const reminderMinutes =
      details.service.serviceGroup.salon.reminderMinutesBefore;
    const reminderTime = subMinutes(
      new Date(details.startTime),
      reminderMinutes,
    );
    const now = new Date();

    const delay = reminderTime.getTime() - now.getTime();

    await this.reminderQueue.add(
      SEND_REMINDER_JOB,
      { reservationId: payload.reservationId },
      {
        delay,
        jobId: payload.reservationId,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.log(
      `Scheduled reminder email for reservation ${payload.reservationId} at ${reminderTime.toISOString()} (${reminderMinutes} minutes before)`,
    );
  }

  @OnEvent(ReservationCancelledEvent.name, { suppressErrors: true })
  private async reservationCancelledSubscriber(
    payload: ReservationCancelledEvent,
  ) {
    const details = await this.getReservationDetails(payload.reservationId);

    if (!details || !details.notificationsConsent) return;

    await this.mailerService.sendMail({
      to: details.clientEmail,
      from: this.appConfig.appServiceEmail,
      subject: `Anulowanie rezerwacji w ${details.service.serviceGroup.salon.name}`,
      template: EmailTemplates.RESERVATION_CANCELLED,
      payload: {
        ...details,
        unsubscribeLink: `${details.service.serviceGroup.salon.frontendUrl}/unsubscribe-notifications?token=${details.id}`,
        salon: details.service.serviceGroup.salon,
      },
    });

    try {
      const job = await this.reminderQueue.getJob(payload.reservationId);
      if (job) {
        await job.remove();
        this.logger.log(
          `Removed reminder job for cancelled reservation ${payload.reservationId}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to remove reminder job for reservation ${payload.reservationId}:`,
        error,
      );
    }
  }

  @OnEvent(ReservationCompletedEvent.name, { suppressErrors: true })
  private async reservationCompletedSubscriber(
    payload: ReservationCompletedEvent,
  ) {
    const details = await this.getReservationDetails(payload.reservationId);

    if (!details || !details.notificationsConsent) return;

    await this.mailerService.sendMail({
      to: details.clientEmail,
      from: this.appConfig.appServiceEmail,
      subject: `Jak oceniasz swoją wizytę w ${details.service.serviceGroup.salon.name}?`,
      template: EmailTemplates.RESERVATION_COMPLETED,
      payload: {
        ...details,
        unsubscribeLink: `${details.service.serviceGroup.salon.frontendUrl}/unsubscribe-notifications?token=${details.id}`,
        salon: details.service.serviceGroup.salon,
      },
    });
  }

  @OnEvent(ReservationTimeChangedEvent.name, { suppressErrors: true })
  private async reservationTimeChangedSubscriber(
    payload: ReservationTimeChangedEvent,
  ) {
    const details = await this.getReservationDetails(payload.reservationId);

    if (!details || !details.notificationsConsent) return;

    const isConfirmed = details.status === ReservationStatus.CONFIRMED;
    const statusMessage = isConfirmed
      ? 'Salon zmienił termin Twojej rezerwacji'
      : 'Zgłoszono zmianę terminu rezerwacji';

    await this.mailerService.sendMail({
      to: details.clientEmail,
      from: this.appConfig.appServiceEmail,
      subject: `Zmiana terminu rezerwacji w ${details.service.serviceGroup.salon.name}`,
      template: EmailTemplates.RESERVATION_TIME_CHANGED,
      payload: {
        reservation: details,
        salon: details.service.serviceGroup.salon,
        service: details.service,
        newStartTime: payload.newStartTime,
        isConfirmed,
        statusMessage,
        unsubscribeLink: `${details.service.serviceGroup.salon.frontendUrl}/unsubscribe-notifications?token=${details.id}`,
        reservationDetailsLink: `${details.service.serviceGroup.salon.frontendUrl}/reservation/${details.id}`,
      },
    });

    try {
      const job = await this.reminderQueue.getJob(payload.reservationId);
      if (job) {
        await job.remove();
        this.logger.log(
          `Removed old reminder job for reservation ${payload.reservationId}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to remove old reminder job for reservation ${payload.reservationId}:`,
        error,
      );
    }

    if (details.status === ReservationStatus.CONFIRMED) {
      const reminderMinutes =
        details.service.serviceGroup.salon.reminderMinutesBefore;
      const reminderTime = subMinutes(payload.newStartTime, reminderMinutes);
      const now = new Date();

      const delay = reminderTime.getTime() - now.getTime();

      await this.reminderQueue.add(
        SEND_REMINDER_JOB,
        { reservationId: payload.reservationId },
        {
          delay,
          jobId: payload.reservationId,
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      this.logger.log(
        `Rescheduled reminder email for reservation ${payload.reservationId} at ${reminderTime.toISOString()} (${reminderMinutes} minutes before)`,
      );
    }
  }

  private async getReservationDetails(reservationId: UUID) {
    return this.tx.reservation.findUnique({
      where: { id: reservationId },
      include: {
        Promotion: true,
        service: {
          include: {
            serviceGroup: {
              include: {
                salon: {
                  include: {
                    address: true,
                    contactInfo: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
