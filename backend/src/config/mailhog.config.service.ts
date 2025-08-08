import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalEnvSchema } from './schemas/local-env.schema';

@Injectable()
export class MailhogConfigService {
  public host: string;
  public port: number;

  constructor(private configService: ConfigService<LocalEnvSchema, true>) {
    this.host = this.configService.get('MAILHOG_HOST');
    this.port = this.configService.get('MAILHOG_SMTP_PORT');
  }
}
