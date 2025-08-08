import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsUrl,
  ValidateIf,
} from 'class-validator';

export class UpdateContactInfoDto {
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @ValidateIf(
    ({ instagramUrl }: { instagramUrl: string | null }) =>
      typeof instagramUrl === 'string' || instagramUrl !== null,
  )
  @IsUrl()
  instagramUrl?: string | null;

  @IsOptional()
  @ValidateIf(
    ({ facebookUrl }: { facebookUrl: string | null }) =>
      typeof facebookUrl === 'string' || facebookUrl !== null,
  )
  @IsUrl()
  facebookUrl?: string | null;
}
