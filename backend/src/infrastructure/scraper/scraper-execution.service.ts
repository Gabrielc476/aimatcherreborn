// src/infrastructure/scraper/scraper-execution.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import * as path from 'path';

@Injectable()
export class ScraperExecutionService {
  private readonly logger = new Logger(ScraperExecutionService.name);
  private isRunning = false;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Verifica se o scraper já está em execução no momento.
   */
  public isScraperRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Executa o script Python do scraper como um processo filho (child_process).
   */
  public async executeScraper(
    engine: string,
    query: string,
    limit: number,
  ): Promise<boolean> {
    if (this.isRunning) {
      this.logger.warn(
        'O Scraper já está rodando em segundo plano. Abortando nova chamada.',
      );
      return false;
    }

    const scraperPath =
      this.configService.get<string>('SCRAPER_PATH') ||
      path.resolve(__dirname, '../../../../scraper');
    const scraperToken = this.configService.get<string>('SCRAPER_API_TOKEN');

    this.logger.log(
      `Iniciando execução do Scraper para engine=${engine}, query="${query}", limit=${limit}`,
    );
    this.isRunning = true;

    return new Promise((resolve) => {
      // Configura variáveis de ambiente herdadas mais o token de comunicação local
      const env = {
        ...process.env,
        SCRAPER_API_TOKEN: scraperToken,
        INTEGRATION_MODE: 'API',
      };

      const args = [
        'main.py',
        '--engine',
        engine,
        '--query',
        query,
        '--limit',
        limit.toString(),
      ];

      // No Windows, a execução pode exigir shell, mas para python direto costuma funcionar sem shell
      const child = spawn('python', args, {
        cwd: scraperPath,
        env,
        shell: true, // Garante compatibilidade de execução no Windows/Powershell/CMD
      });

      child.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          this.logger.log(`[Python Scraper stdout] ${output}`);
        }
      });

      child.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          this.logger.error(`[Python Scraper stderr] ${output}`);
        }
      });

      child.on('close', (code) => {
        this.isRunning = false;
        if (code === 0) {
          this.logger.log(`Scraper finalizado com sucesso (exit code ${code})`);
          resolve(true);
        } else {
          this.logger.error(`Scraper finalizado com erro (exit code ${code})`);
          resolve(false);
        }
      });

      child.on('error', (err) => {
        this.isRunning = false;
        this.logger.error(
          `Falha ao disparar o subprocesso Python: ${err.message}`,
        );
        resolve(false);
      });
    });
  }
}
