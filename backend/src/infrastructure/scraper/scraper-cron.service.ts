// src/infrastructure/scraper/scraper-cron.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScraperExecutionService } from './scraper-execution.service';
import { PrismaService } from '../database/prisma.service';
import { VagaRepository } from '../../domain/repositories/vaga.repository';

@Injectable()
export class ScraperCronService {
  private readonly logger = new Logger(ScraperCronService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly scraperExecutionService: ScraperExecutionService,
    private readonly prisma: PrismaService,
    private readonly vagaRepository: VagaRepository,
  ) {}

  /**
   * Cron Job rodado diariamente à meia-noite para garimpar novas vagas.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyScrape() {
    this.logger.log('Iniciando rotina diária de scraping de vagas...');

    const queries = this.configService
      .get<string>('SCRAPER_DEFAULT_QUERIES')
      ?.split(',') || ['Python', 'React', 'Node'];
    const engines = ['weworkremotely', 'linkedin'];
    const limit = 5; // Limite padrão modesto por execução automática

    for (const engine of engines) {
      for (const query of queries) {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) continue;

        try {
          this.logger.log(
            `Cron: Executando engine=${engine} para query="${trimmedQuery}"`,
          );
          // Espera a finalização de um antes de começar o próximo para não sobrecarregar
          await this.scraperExecutionService.executeScraper(
            engine,
            trimmedQuery,
            limit,
          );
        } catch (err) {
          this.logger.error(
            `Cron: Erro ao executar scraper para engine=${engine}, query="${trimmedQuery}":`,
            err,
          );
        }
      }
    }

    this.logger.log('Rotina diária de scraping finalizada.');
  }

  /**
   * Cron Job rodado diariamente às 3:00 da manhã para expirar vagas externas antigas (TTL).
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleVacancyExpiration() {
    this.logger.log(
      'Iniciando rotina diária de expiração de vagas externas...',
    );

    try {
      // 1. Busca o usuário virtual 'Scraper'
      const scraperEmail = 'scraper@aimatcher.com';
      const scraperUser = await this.prisma.usuario.findUnique({
        where: { email: scraperEmail },
      });

      if (!scraperUser) {
        this.logger.warn(
          `Rotina de expiração abortada: Usuário virtual '${scraperEmail}' não encontrado.`,
        );
        return;
      }

      // 2. Obtém a configuração de TTL (dias)
      const ttlDaysConfig = this.configService.get<string | number>(
        'SCRAPER_VACANCY_TTL_DAYS',
      );
      const ttlDays = Number(ttlDaysConfig) || 21;

      // 3. Calcula a data limite para expiração
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - ttlDays);

      this.logger.log(
        `Expirando vagas do Robô Scraper anteriores a ${dataLimite.toISOString()} (TTL = ${ttlDays} dias)`,
      );

      // 4. Executa a expiração no contexto RLS do usuário Scraper
      await PrismaService.als.run({ userId: scraperUser.id }, async () => {
        const count = await this.vagaRepository.expirarVagasAntigas(
          scraperUser.id,
          dataLimite,
        );
        this.logger.log(
          `Rotina diária de expiração finalizada. Total de vagas expiradas: ${count}`,
        );
      });
    } catch (err: any) {
      this.logger.error('Erro na rotina de expiração de vagas:', err);
    }
  }
}
