import { ItemDto } from '@root/libs/api/item.dto';

export class SalonItemDto extends ItemDto {
  city?: string;

  constructor({ id, name, city }: SalonItemDto) {
    super({ id, name });
    Object.assign(this, { id, name, city });
  }
}
