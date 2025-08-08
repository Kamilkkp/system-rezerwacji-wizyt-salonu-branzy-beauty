import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { UUID } from 'crypto';
import { InjectTransaction, Transaction } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { MailerService } from '@infrastructure/mailer/mailer-service';
import { EmailTemplates } from '@infrastructure/mailer/mailer.interface';
import { AppConfigService } from '@root/config/app.config.service';
import { ReservationStatus } from '@prisma/client';

export interface ReminderEmailJobData {
  reservationId: UUID;
}

export const REMINDER_EMAILS_QUEUE = 'reminder-emails';

export const SEND_REMINDER_JOB = 'send-reminder';

@Processor(REMINDER_EMAILS_QUEUE)
export class ReminderEmailProcessor {
  private readonly logger = new Logger(ReminderEmailProcessor.name);

  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
    private readonly mailerService: MailerService,
    private readonly appConfig: AppConfigService,
  ) {}

  @Process(SEND_REMINDER_JOB)
  async handleSendReminder(job: Job<ReminderEmailJobData>) {
    const { reservationId } = job.data;

    this.logger.log(
      `Processing reminder email for reservation: ${reservationId}`,
    );

    try {
      const reservation = await this.tx.reservation.findUnique({
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

      if (!reservation) {
        this.logger.warn(`Reservation ${reservationId} not found`);
        return;
      }

      if (!reservation.notificationsConsent) {
        return;
      }

      if (reservation.status !== ReservationStatus.CONFIRMED) {
        this.logger.log(
          `Reservation ${reservationId} is no longer confirmed, skipping reminder`,
        );
        return;
      }

      const reminderMinutes =
        reservation.service.serviceGroup.salon.reminderMinutesBefore;
      const reminderTimeText = this.formatReminderTime(reminderMinutes);

      await this.mailerService.sendMail({
        to: reservation.clientEmail,
        from: this.appConfig.appServiceEmail,
        subject: `Przypomnienie o wizycie w ${reservation.service.serviceGroup.salon.name}`,
        template: EmailTemplates.RESERVATION_REMINDER,
        payload: {
          reservation,
          salon: reservation.service.serviceGroup.salon,
          service: reservation.service,
          reminderTimeText,
          unsubscribeLink: `${reservation.service.serviceGroup.salon.frontendUrl}/unsubscribe-notifications?token=${reservation.id}`,
          reservationDetailsLink: `${reservation.service.serviceGroup.salon.frontendUrl}/reservation/${reservation.id}`,
        },
      });

      this.logger.log(
        `Reminder email sent successfully for reservation: ${reservationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send reminder email for reservation ${reservationId}:`,
        error,
      );
      throw error;
    }
  }

  private formatReminderTime(minutes: number): string {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      if (remainingMinutes === 0) {
        return hours === 1 ? '1 godzinę' : `${hours} godzin`;
      } else {
        const hourText = hours === 1 ? '1 godzinę' : `${hours} godzin`;
        const minuteText =
          remainingMinutes === 1 ? '1 minutę' : `${remainingMinutes} minut`;
        return `${hourText} i ${minuteText}`;
      }
    } else {
      return minutes === 1 ? '1 minutę' : `${minutes} minut`;
    }
  }
}
