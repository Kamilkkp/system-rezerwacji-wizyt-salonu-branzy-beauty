import { Module } from '@nestjs/common';
import { ReservationsModule } from '../reservations/reservations.module';
import { CalendarExportService } from './calendar-export.service';
import { SalonsModule } from '../salons/salons.module';

@Module({
  imports: [ReservationsModule, SalonsModule],
  providers: [CalendarExportService],
  exports: [CalendarExportService],
})
export class CalendarModule {}
