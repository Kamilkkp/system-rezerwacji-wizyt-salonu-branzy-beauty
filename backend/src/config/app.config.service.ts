import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseEnvSchema } from '@root/config/schemas/base-env.schema';
import { EnvironmentValue } from './enums/environment-value.enum';

@Injectable()
export class AppConfigService {
  public readonly env: EnvironmentValue;
  public readonly bmsFrontendUrl: string;
  public readonly apiUrl: string;
  public readonly appServiceEmail: string;
  public readonly isProduction: boolean;
  public readonly isLocal: boolean;

  constructor(private configService: ConfigService<BaseEnvSchema, true>) {
    this.env = this.configService.get('NODE_ENV');
    this.apiUrl = this.configService.get('API_URL');
    this.appServiceEmail = this.configService.get('APP_SERVICE_EMAIL');
    this.bmsFrontendUrl = this.configService.get('BMS_FRONTEND_URL');

    this.isLocal = this.env === EnvironmentValue.Local;
    this.isProduction = this.env === EnvironmentValue.Production;
  }
}
