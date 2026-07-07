// src/presentation/nest-modules/scraper.module.ts

import { Module } from '@nestjs/common';
import { ScraperController } from '../controllers/scraper.controller';
import { ScraperExecutionService } from '../../infrastructure/scraper/scraper-execution.service';
import { ScraperCronService } from '../../infrastructure/scraper/scraper-cron.service';

@Module({
  controllers: [ScraperController],
  providers: [ScraperExecutionService, ScraperCronService],
  exports: [ScraperExecutionService],
})
export class ScraperModule {}
