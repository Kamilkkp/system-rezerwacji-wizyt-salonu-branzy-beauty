import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductionEnvSchema } from './schemas/production-env.schema';

@Injectable()
export class SesConfigService {
  public region: string;
  public accessKeyId: string;
  public secretAccessKey: string;

  constructor(private configService: ConfigService<ProductionEnvSchema, true>) {
    this.region = this.configService.get('AWS_REGION') || 'us-east-1';
    this.accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
    this.secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');
  }
}
