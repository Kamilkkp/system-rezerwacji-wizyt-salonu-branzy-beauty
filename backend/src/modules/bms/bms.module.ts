import { Module } from '@nestjs/common';
import { SalonsController } from './controllers/salons.controller';
import { CoreModule } from '../core/core.module';
import { AccountController } from './controllers/account.controller';
import { ServiceGroupsController } from './controllers/service-groups.controller';
import { AuthModule } from '@infrastructure/auth/auth.module';
import { ServicesController } from './controllers/services.controller';
import { PromotionsController } from './controllers/promotions.controller';
import { ReservationsController } from './controllers/reservations.controller';
import { MailingSystemController } from './controllers/mailing-system.controller';
import { OpenHoursExceptionsController } from './controllers/open-hours-exceptions.controller';

@Module({
  imports: [CoreModule, AuthModule],
  controllers: [
    SalonsController,
    AccountController,
    ServiceGroupsController,
    ServicesController,
    PromotionsController,
    ReservationsController,
    MailingSystemController,
    OpenHoursExceptionsController,
  ],
})
export class BmsModule {}
