import { PartialType } from '@nestjs/swagger';
import { CreateOpenHoursExceptionDto } from './create-open-hours-exception.dto';

export class UpdateOpenHoursExceptionDto extends PartialType(
  CreateOpenHoursExceptionDto,
) {}
