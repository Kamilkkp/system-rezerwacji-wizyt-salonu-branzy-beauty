import { Module } from '@nestjs/common';
import { MailerService } from './mailer-service';
import { MailhogMailerService } from './infrastructure/mailhog-mailer.service';
import { SesMailerService } from './infrastructure/ses-mailer.service';
import { AppConfigService } from '@root/config/app.config.service';
import { SesConfigService } from '@root/config/ses.config.service';
import { MailhogConfigService } from '@root/config/mailhog.config.service';

const services = [
  {
    provide: MailerService,
    useFactory(
      appConfig: AppConfigService,
      sesConfig: SesConfigService,
      mailhogConfig: MailhogConfigService,
    ) {
      if (appConfig.isProduction) return new SesMailerService(sesConfig);
      if (appConfig.isLocal) {
        return new MailhogMailerService(mailhogConfig);
      }
    },
    inject: [AppConfigService, SesConfigService, MailhogConfigService],
  },
];

@Module({
  providers: services,
  exports: services,
})
export class MailerModule {}
