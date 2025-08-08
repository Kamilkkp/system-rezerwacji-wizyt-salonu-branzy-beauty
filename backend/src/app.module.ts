import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { BullModule } from '@nestjs/bull';
import { RedisConfigService } from './config/redis.config.service';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { PrismaModule } from '@infrastructure/prisma/prisma.module';
import { ClsModule } from 'nestjs-cls';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { PublicModule } from './modules/public/public.module';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { BmsModule } from './modules/bms/bms.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    PrismaModule,
    ClsModule.forRoot({
      global: true,
      plugins: [
        new ClsPluginTransactional({
          imports: [PrismaModule],
          adapter: new TransactionalAdapterPrisma({
            prismaInjectionToken: PrismaService,
            sqlFlavor: 'postgresql',
          }),
          enableTransactionProxy: true,
        }),
      ],
      middleware: {
        mount: true,
      },
    }),
    ConfigModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: (redisConfig: RedisConfigService) => ({
        redis: redisConfig,
      }),
      inject: [RedisConfigService],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [RedisConfigService],
      useFactory: (redisConfig: RedisConfigService) => ({
        stores: [createKeyv(`redis://${redisConfig.host}:${redisConfig.port}`)],
      }),
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    BmsModule,
    PublicModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
