import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { BaseEnvSchema } from './base-env.schema';

export class LocalEnvSchema extends BaseEnvSchema {
  @IsString()
  @IsNotEmpty()
  MAILHOG_HOST!: string;

  @IsNumber()
  @IsNotEmpty()
  MAILHOG_SMTP_PORT!: number;
}
