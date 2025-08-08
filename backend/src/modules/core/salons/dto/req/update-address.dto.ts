import {
  IsOptional,
  IsPostalCode,
  IsString,
  ValidateIf,
} from 'class-validator';

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  streetName?: string;

  @IsOptional()
  @IsString()
  streetNumber?: string;

  @IsOptional()
  @IsString()
  apartment?: string;

  @IsOptional()
  @ValidateIf(
    ({ postalCode }: { postalCode: string | null }) =>
      typeof postalCode === 'string' || postalCode !== null,
  )
  @IsPostalCode('PL')
  postalCode?: string;

  @IsOptional()
  @IsString()
  city?: string;
}
