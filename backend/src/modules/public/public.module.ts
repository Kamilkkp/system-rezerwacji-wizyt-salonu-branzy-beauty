import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [CoreModule],
  controllers: [PublicController],
})
export class PublicModule {}
