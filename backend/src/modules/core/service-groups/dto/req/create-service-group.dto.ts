import { IsOptional, IsString } from 'class-validator';

export class CreateServiceGroupDto {
  @IsString()
  name!: string;

  @IsOptional()
  description?: string;
}
