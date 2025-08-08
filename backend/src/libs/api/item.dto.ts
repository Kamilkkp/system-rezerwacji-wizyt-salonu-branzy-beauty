export class ItemDto {
  id!: string;
  name!: string;

  constructor({ id, name }: ItemDto) {
    Object.assign(this, { id, name });
  }
}
