import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseEnvSchema } from '@root/config/schemas/base-env.schema';

@Injectable()
export class RedisConfigService {
  public host: string;
  public port: number;
  constructor(private configService: ConfigService<BaseEnvSchema, true>) {
    this.host = this.configService.get('REDIS_HOST');
    this.port = this.configService.get('REDIS_PORT');
  }
}
