import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app.config.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { HttpExceptionFilter } from './libs/filters/http-exception-filter';
import { AllowedOriginsService } from './modules/core/salons/allowed-origins.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig = app.get(AppConfigService);
  const allowedOriginsService = app.get(AllowedOriginsService);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      validateCustomDecorators: true,
    }),
  );
  app.enableShutdownHooks();
  app.useGlobalFilters(new HttpExceptionFilter());

  app.use(helmet());

  app.enableCors({
    origin: async (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      try {
        const allowedOrigins = await allowedOriginsService.getAllowedOrigins();
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      } catch {
        callback(new Error('CORS check failed'));
      }
    },
    credentials: true,
    exposedHeaders: ['authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  const swaggerConfig = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Backend API doc')
    .setDescription('Backend API description')
    .addTag('Auth', 'Authentication endpoints for Business Management System')
    .addTag('BMS Account')
    .addTag('BMS Salons')
    .addTag('BMS Salon Open-hours-exceptions')
    .addTag('BMS Service Groups')
    .addTag('BMS Services')
    .addTag('BMS Promotions')
    .addTag('BMS Reservations')
    .addTag('Public API', 'Endpoints for the public-facing client website')
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig, {
      autoTagControllers: true,
    });
  SwaggerModule.setup('api', app, documentFactory);
  await app.listen(3000);

  if (appConfig.isLocal) {
    Logger.log(`Server is listening on ${appConfig.apiUrl}`);
    Logger.log(`API doc: ${appConfig.apiUrl}/api`);
  } else {
    Logger.log(`Server is listening on ${appConfig.apiUrl}`);
    Logger.log(`API doc: ${appConfig.apiUrl}/api`);
  }
}
bootstrap();
