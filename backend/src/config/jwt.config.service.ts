import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseEnvSchema } from '@root/config/schemas/base-env.schema';

@Injectable()
export class JwtConfigService {
  public readonly jwtSecret: string;
  public readonly jwtExpirationTime: number;
  public readonly jwtRefreshSecret: string;
  public readonly jwtRefreshExpirationTime: number;

  constructor(private configService: ConfigService<BaseEnvSchema, true>) {
    this.jwtSecret = this.configService.get('JWT_SECRET');
    this.jwtExpirationTime = this.configService.get('JWT_EXPIRATION_TIME');
    this.jwtRefreshSecret = this.configService.get('JWT_REFRESH_SECRET');
    this.jwtRefreshExpirationTime = this.configService.get(
      'JWT_REFRESH_EXPIRATION_TIME',
    );
  }
}
