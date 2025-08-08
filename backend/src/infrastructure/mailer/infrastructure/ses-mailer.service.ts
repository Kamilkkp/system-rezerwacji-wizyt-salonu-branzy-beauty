import { Injectable } from '@nestjs/common';
import { MailerService } from '../mailer-service';
import { SesConfigService } from '@root/config/ses.config.service';
import { createTransport, Transporter } from 'nodemailer';
import * as aws from '@aws-sdk/client-ses';
import { EmailProviderRequestPayload } from '../mailer-service';

@Injectable()
export class SesMailerService extends MailerService {
  constructor(private readonly sesConfig: SesConfigService) {
    super(SesMailerService.name, sesConfig);
  }

  protected initTransporter(sesConfig: SesConfigService): Transporter {
    const ses = new aws.SES({
      region: sesConfig.region,
      credentials: {
        accessKeyId: sesConfig.accessKeyId,
        secretAccessKey: sesConfig.secretAccessKey,
      },
    });

    return createTransport({
      SES: { ses, aws },
    });
  }

  protected async dispatchToMailProvider(
    payload: EmailProviderRequestPayload,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        ...payload,
      });

      const recipients = Array.isArray(payload.to)
        ? payload.to.join(', ')
        : payload.to;
      this.logger.log(
        `[Mailer Service][SES] Email with subject: "${payload.subject}" sent to "${recipients}".`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `[Mailer Service][SES] Failed to send email: ${errorMessage}`,
      );

      throw new Error(`Failed to send email via SES: ${errorMessage}`);
    }
  }
}
