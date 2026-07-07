// src/infrastructure/scraper/scraper-cron.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScraperExecutionService } from './scraper-execution.service';

@Injectable()
export class ScraperCronService {
  private readonly logger = new Logger(ScraperCronService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly scraperExecutionService: ScraperExecutionService,
  ) {}

  /**
   * Cron Job rodado diariamente à meia-noite para garimpar novas vagas.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyScrape() {
    this.logger.log('Iniciando rotina diária de scraping de vagas...');

    const queries = this.configService.get<string>('SCRAPER_DEFAULT_QUERIES')?.split(',') || ['Python', 'React', 'Node'];
    const engines = ['weworkremotely', 'linkedin'];
    const limit = 5; // Limite padrão modesto por execução automática

    for (const engine of engines) {
      for (const query of queries) {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) continue;

        try {
          this.logger.log(`Cron: Executando engine=${engine} para query="${trimmedQuery}"`);
          // Espera a finalização de um antes de começar o próximo para não sobrecarregar
          await this.scraperExecutionService.executeScraper(engine, trimmedQuery, limit);
        } catch (err) {
          this.logger.error(`Cron: Erro ao executar scraper para engine=${engine}, query="${trimmedQuery}":`, err);
        }
      }
    }

    this.logger.log('Rotina diária de scraping finalizada.');
  }
}
