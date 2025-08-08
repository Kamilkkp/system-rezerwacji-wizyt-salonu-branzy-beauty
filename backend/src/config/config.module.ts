import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { RedisConfigService } from './redis.config.service';
import { validateEnvSchema } from './tools/validate-env-schema';
import { MailhogConfigService } from './mailhog.config.service';
import { AppConfigService } from './app.config.service';
import { JwtConfigService } from './jwt.config.service';
import { SesConfigService } from './ses.config.service';

@Global()
@Module({})
export class ConfigModule {
  static forRoot(): DynamicModule {
    return {
      module: ConfigModule,
      imports: [
        NestConfigModule.forRoot({
          validate: validateEnvSchema,
        }),
      ],
      providers: [
        RedisConfigService,
        MailhogConfigService,
        SesConfigService,
        AppConfigService,
        JwtConfigService,
      ],
      exports: [
        RedisConfigService,
        MailhogConfigService,
        SesConfigService,
        AppConfigService,
        JwtConfigService,
      ],
    };
  }
}
