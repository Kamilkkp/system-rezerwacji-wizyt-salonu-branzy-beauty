import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { EnvironmentValue } from '../enums/environment-value.enum';

export class BaseEnvSchema {
  @IsEnum(EnvironmentValue)
  @IsString()
  @IsNotEmpty()
  NODE_ENV!: EnvironmentValue;

  @IsString()
  @IsNotEmpty()
  API_URL!: string;

  @IsString()
  @IsNotEmpty()
  BMS_FRONTEND_URL!: string;

  @IsString()
  @IsNotEmpty()
  APP_SERVICE_EMAIL!: string;

  @IsString()
  @IsNotEmpty()
  POSTGRES_HOST!: string;

  @IsNumber()
  @IsNotEmpty()
  POSTGRES_PORT!: number;

  @IsString()
  @IsNotEmpty()
  POSTGRES_USER!: string;

  @IsString()
  @IsNotEmpty()
  POSTGRES_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  POSTGRES_DB!: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  REDIS_HOST!: string;

  @IsNumber()
  @IsNotEmpty()
  REDIS_PORT!: number;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsNumber()
  @IsNotEmpty()
  JWT_EXPIRATION_TIME!: number;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsNumber()
  @IsNotEmpty()
  JWT_REFRESH_EXPIRATION_TIME!: number;
}
