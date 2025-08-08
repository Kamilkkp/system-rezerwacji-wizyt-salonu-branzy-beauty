import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MailingSystemService } from './mailing-system.service';
import { MailerModule } from '@infrastructure/mailer/mailer.module';
import {
  REMINDER_EMAILS_QUEUE,
  ReminderEmailProcessor,
} from './processors/reminder-email.processor';

@Module({
  imports: [
    MailerModule,
    BullModule.registerQueue({
      name: REMINDER_EMAILS_QUEUE,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 20,
      },
    }),
  ],
  providers: [MailingSystemService, ReminderEmailProcessor],
  exports: [MailingSystemService],
})
export class MailingSystemModule {}
