import { Module } from '@nestjs/common';
import { SalonsService } from './salons.service';
import { OpenHoursExceptionsService } from './open-hours-exceptions.service';
import { AllowedOriginsService } from './allowed-origins.service';

@Module({
  providers: [SalonsService, OpenHoursExceptionsService, AllowedOriginsService],
  exports: [SalonsService, OpenHoursExceptionsService, AllowedOriginsService],
})
export class SalonsModule {}
