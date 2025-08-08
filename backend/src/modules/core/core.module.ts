import { Module } from '@nestjs/common';
import { SalonsModule } from '../core/salons/salons.module';
import { AccountModule } from './account/account.module';
import { ServiceGroupsModule } from './service-groups/service-groups.module';
import { ServicesModule } from './services/services.module';
import { PromotionsModule } from './promotions/promotions.module';
import { ReservationsModule } from './reservations/reservations.module';
import { MailingSystemModule } from './mailing-system/mailing-system.module';
import { CalendarModule } from './calendar/calendar.module';

@Module({
  imports: [
    SalonsModule,
    AccountModule,
    ServiceGroupsModule,
    ServicesModule,
    PromotionsModule,
    ReservationsModule,
    MailingSystemModule,
    CalendarModule,
  ],
  exports: [
    SalonsModule,
    AccountModule,
    ServiceGroupsModule,
    ServicesModule,
    PromotionsModule,
    ReservationsModule,
    MailingSystemModule,
    CalendarModule,
  ],
})
export class CoreModule {}
