import { IsNotEmpty, IsString } from 'class-validator';
import { BaseEnvSchema } from './base-env.schema';

export class ProductionEnvSchema extends BaseEnvSchema {
  @IsString()
  @IsNotEmpty()
  AWS_REGION!: string;

  @IsString()
  @IsNotEmpty()
  AWS_ACCESS_KEY_ID!: string;

  @IsString()
  @IsNotEmpty()
  AWS_SECRET_ACCESS_KEY!: string;
}
