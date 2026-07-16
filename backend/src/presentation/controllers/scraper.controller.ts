// src/presentation/controllers/scraper.controller.ts

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import { ScraperExecutionService } from '../../infrastructure/scraper/scraper-execution.service';

@Controller('scraper')
export class ScraperController {
  constructor(
    private readonly scraperExecutionService: ScraperExecutionService,
  ) {}

  @Post('disparar')
  @HttpCode(HttpStatus.ACCEPTED)
  async disparar(
    @Body() body: { engine: string; query: string; limit?: number },
  ) {
    const { engine, query, limit = 5 } = body;

    if (!engine || !query) {
      return {
        erro: 'Os campos engine e query são obrigatórios',
      };
    }

    if (this.scraperExecutionService.isScraperRunning()) {
      throw new ConflictException('O scraper já está em execução no momento.');
    }

    // Executa em segundo plano de forma assíncrona (não espera terminar)
    this.scraperExecutionService
      .executeScraper(engine, query, limit)
      .catch((err) => {
        console.error('Erro na execução assíncrona do scraper:', err);
      });

    return {
      mensagem: 'Scraper iniciado com sucesso em segundo plano',
      detalhes: { engine, query, limit },
    };
  }
}
