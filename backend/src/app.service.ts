import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly db: PrismaService) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async databaseHealthCheck(): Promise<void> {
    try {
      await this.db.$queryRaw`Select 1`;
    } catch (error) {
      this.logger.error(error);
      process.exit(1);
    }
  }
}
