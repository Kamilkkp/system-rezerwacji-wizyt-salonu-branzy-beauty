import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AppConfigService } from '@root/config/app.config.service';
import { OnEvent } from '@nestjs/event-emitter';
import { SalonFrontendUrlUpdatedEvent } from './events/salon-frontend-url-updated.event';
import { SalonWithFrontendUrlDeletedEvent } from './events/salon-with-frontend-url-deleted.event';
import { InjectTransaction, Transaction } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

@Injectable()
export class AllowedOriginsService {
  private readonly CACHE_KEY = 'allowed_origins';

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
    private readonly appConfig: AppConfigService,
  ) {}

  async getAllowedOrigins(): Promise<string[]> {
    const cachedOrigins = await this.cacheManager.get<string[]>(this.CACHE_KEY);
    if (cachedOrigins) {
      return cachedOrigins;
    }

    const origins = await this.buildAllowedOrigins();

    await this.cacheManager.set(this.CACHE_KEY, origins);

    return origins;
  }

  @OnEvent(SalonWithFrontendUrlDeletedEvent.name, { suppressErrors: false })
  @OnEvent(SalonFrontendUrlUpdatedEvent.name, { suppressErrors: false })
  private async invalidateCache(): Promise<void> {
    await this.cacheManager.del(this.CACHE_KEY);
  }

  private async buildAllowedOrigins(): Promise<string[]> {
    const salons = await this.tx.salon.findMany({
      select: {
        frontendUrl: true,
      },
      where: {
        frontendUrl: {
          not: null,
        },
      },
    });

    const salonUrls = salons
      .map((salon) => salon.frontendUrl)
      .filter(Boolean) as string[];

    return [...salonUrls, this.appConfig.bmsFrontendUrl, this.appConfig.apiUrl];
  }
}
