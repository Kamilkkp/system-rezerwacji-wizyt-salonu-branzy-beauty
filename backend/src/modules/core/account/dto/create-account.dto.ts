import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsStrongPassword({
    minLength: 6,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  password!: string;

  @IsEmail()
  email!: string;

  constructor({ firstName, lastName, password, email }: CreateAccountDto) {
    Object.assign(this, { firstName, lastName, password, email });
  }
}
