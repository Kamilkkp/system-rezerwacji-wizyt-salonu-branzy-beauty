import { Readable } from 'stream';

export interface EmailAttachment {
  filename?: string | false;
  encoding?: string;
  contentType?: string;
  contentTransferEncoding?: '7bit' | 'base64' | 'quoted-printable' | false;
  contentDisposition?: 'attachment' | 'inline';
  raw?: string | Buffer | Readable;
  content?: string | Buffer | Readable;
}

export interface SendMailPayload {
  from: string;
  replyTo?: string;
  to: string | string[];
  subject: string;
  template: EmailTemplates;
  skipSubjectPrefix?: boolean;
  payload: object;
  attachments?: EmailAttachment[];
}

export enum EmailTemplates {
  NEW_RESERVATION = 'new-reservation.hbs',
  RESERVATION_CANCELLED = 'reservation-cancelled.hbs',
  RESERVATION_CONFIRMED = 'reservation-confirmed.hbs',
  RESERVATION_COMPLETED = 'reservation-completed.hbs',
  RESERVATION_REMINDER = 'reservation-reminder.hbs',
  RESERVATION_TIME_CHANGED = 'reservation-time-changed.hbs',
  CUSTOM_MARKETING = 'custom-marketing.hbs',
}

export interface Mailer {
  sendMail(payload: SendMailPayload): Promise<void>;
}
