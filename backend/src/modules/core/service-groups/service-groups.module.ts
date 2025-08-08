import { Module } from '@nestjs/common';
import { ServiceGroupsService } from './service-groups.service';

@Module({
  providers: [ServiceGroupsService],
  exports: [ServiceGroupsService],
})
export class ServiceGroupsModule {}
