export class AccountDto {
  id!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor({
    id,
    firstName,
    lastName,
    email,
    createdAt,
    updatedAt,
  }: AccountDto) {
    Object.assign(this, {
      id,
      firstName,
      lastName,
      email,
      createdAt,
      updatedAt,
    });
  }
}
