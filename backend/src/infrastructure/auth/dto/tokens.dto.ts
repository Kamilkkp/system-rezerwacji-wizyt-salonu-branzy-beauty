import { IsJWT, IsNotEmpty } from 'class-validator';

export class TokensDto {
  @IsJWT()
  @IsNotEmpty()
  readonly access_token!: string;

  @IsJWT()
  @IsNotEmpty()
  readonly refresh_token!: string;
}
