import {
  EmailAttachment,
  EmailTemplates,
  Mailer,
  SendMailPayload,
} from '@infrastructure/mailer/mailer.interface';
import { Transporter } from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import handlebars from 'handlebars';
import { Logger } from '@nestjs/common';

export interface EmailProviderRequestPayload {
  from: string;
  to: string[] | string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  tag?: EmailTemplates;
}

export abstract class MailerService implements Mailer {
  protected transporter: Transporter;
  protected readonly logger: Logger;

  constructor(name: string, config: unknown) {
    this.transporter = this.initTransporter(config);
    this.logger = new Logger(name);
    this.registerHandlebarsHelpers();
  }

  protected abstract initTransporter(config: unknown): Transporter;

  public async sendMail({
    from,
    to,
    replyTo,
    payload,
    subject,
    template,
    attachments,
  }: SendMailPayload) {
    const htmlToSend = this.generateHtmlToSend({ payload, template });

    await this.dispatchToMailProvider({
      from,
      replyTo,
      to,
      subject,
      html: htmlToSend,
      attachments: attachments ?? undefined,
      tag: template,
    });
  }

  protected abstract dispatchToMailProvider(
    payload: EmailProviderRequestPayload,
  ): Promise<void>;

  private generateHtmlToSend({
    payload,
    template: templateName,
  }: Pick<SendMailPayload, 'payload' | 'template'>): string {
    const pathToFile =
      process.env.NODE_ENV === 'production'
        ? path.join(
            process.cwd(),
            'dist',
            'infrastructure',
            'mailer',
            'templates',
            `${templateName}`,
          )
        : path.join(
            process.cwd(),
            'src',
            'infrastructure',
            'mailer',
            'templates',
            `${templateName}`,
          );

    const sharedStylesPath =
      process.env.NODE_ENV === 'production'
        ? path.join(
            process.cwd(),
            'dist',
            'infrastructure',
            'mailer',
            'templates',
            'shared-styles.hbs',
          )
        : path.join(
            process.cwd(),
            'src',
            'infrastructure',
            'mailer',
            'templates',
            'shared-styles.hbs',
          );

    const emailTemplateSource = fs.readFileSync(pathToFile, 'utf-8');
    const sharedStyles = fs.readFileSync(sharedStylesPath, 'utf-8');

    const payloadWithStyles = {
      ...payload,
      sharedStyles,
    };

    const template = handlebars.compile(emailTemplateSource);
    return template(payloadWithStyles);
  }

  protected registerHandlebarsHelpers() {
    handlebars.registerHelper('eq', function <
      T,
    >(this: unknown, a: T, b: T, options: handlebars.HelperOptions) {
      return a === b ? options.fn(this) : options.inverse(this);
    });

    handlebars.registerHelper('formatDateTime', (date: Date) => {
      return date.toLocaleString('pl-PL');
    });
  }
}
