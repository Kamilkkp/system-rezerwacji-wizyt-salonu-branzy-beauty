import { IsString } from 'class-validator';

export class CreateSalonDto {
  @IsString()
  name!: string;
}
