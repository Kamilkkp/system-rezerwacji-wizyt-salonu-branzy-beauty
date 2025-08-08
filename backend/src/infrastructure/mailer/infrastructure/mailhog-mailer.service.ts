import { createTransport } from 'nodemailer';
import {
  MailerService,
  EmailProviderRequestPayload,
} from '@infrastructure/mailer/mailer-service';
import { MailhogConfigService } from '@root/config/mailhog.config.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailhogMailerService extends MailerService {
  constructor(private readonly mailhogConfig: MailhogConfigService) {
    super(MailhogMailerService.name, mailhogConfig);
  }

  protected initTransporter(mailhogConfig: MailhogConfigService) {
    return createTransport({
      ...mailhogConfig,
      ignoreTLS: true,
      secure: false,
    });
  }

  protected async dispatchToMailProvider(
    payload: EmailProviderRequestPayload,
  ): Promise<void> {
    await this.transporter.sendMail(payload);

    this.logger.log(
      `Email with subject: "${payload.subject}" sent to ${Array.isArray(payload.to) ? payload.to.join(', ') : payload.to}.`,
    );
  }
}
