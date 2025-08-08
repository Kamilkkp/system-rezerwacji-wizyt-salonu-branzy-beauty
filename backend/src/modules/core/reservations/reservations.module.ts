import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { AvailableSlotsService } from './available-slots.service';
import { SalonsModule } from '../salons/salons.module';

@Module({
  imports: [SalonsModule],
  providers: [ReservationsService, AvailableSlotsService],
  exports: [ReservationsService, AvailableSlotsService],
})
export class ReservationsModule {}
