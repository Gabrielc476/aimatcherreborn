// src/infrastructure/scraper/scraper-cron.service.spec.ts

import { ScraperCronService } from './scraper-cron.service';
import { ConfigService } from '@nestjs/config';
import { ScraperExecutionService } from './scraper-execution.service';
import { PrismaService } from '../database/prisma.service';
import { VagaRepository } from '../../domain/repositories/vaga.repository';

describe('ScraperCronService', () => {
  let cronService: ScraperCronService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockScraperExecutionService: jest.Mocked<ScraperExecutionService>;
  let mockPrismaService: any;
  let mockVagaRepository: jest.Mocked<VagaRepository>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn(),
    } as any;

    mockScraperExecutionService = {} as any;

    mockPrismaService = {
      usuario: {
        findUnique: jest.fn(),
      },
    };

    mockVagaRepository = {
      expirarVagasAntigas: jest.fn(),
    } as any;

    cronService = new ScraperCronService(
      mockConfigService,
      mockScraperExecutionService,
      mockPrismaService as PrismaService,
      mockVagaRepository,
    );
  });

  describe('handleVacancyExpiration', () => {
    it('deve expirar vagas com sucesso quando o usuario virtual scraper existe', async () => {
      const mockScraperUser = {
        id: 'scraper-uuid-123',
        email: 'scraper@aimatcher.com',
      };
      mockPrismaService.usuario.findUnique.mockResolvedValue(mockScraperUser);
      mockConfigService.get.mockReturnValue('15'); // 15 dias de TTL
      mockVagaRepository.expirarVagasAntigas.mockResolvedValue(10); // 10 vagas expiradas

      await cronService.handleVacancyExpiration();

      expect(mockPrismaService.usuario.findUnique).toHaveBeenCalledWith({
        where: { email: 'scraper@aimatcher.com' },
      });
      expect(mockConfigService.get).toHaveBeenCalledWith(
        'SCRAPER_VACANCY_TTL_DAYS',
      );
      expect(mockVagaRepository.expirarVagasAntigas).toHaveBeenCalledWith(
        'scraper-uuid-123',
        expect.any(Date),
      );

      // Verifica se a data limite passada está correta (cerca de 15 dias atrás)
      const dataLimiteChamada =
        mockVagaRepository.expirarVagasAntigas.mock.calls[0][1];
      const quinzeDiasAtras = new Date();
      quinzeDiasAtras.setDate(quinzeDiasAtras.getDate() - 15);

      // Diferença em ms deve ser menor que 1 segundo
      expect(
        Math.abs(dataLimiteChamada.getTime() - quinzeDiasAtras.getTime()),
      ).toBeLessThan(1000);
    });

    it('deve usar o valor padrao de 21 dias se a variavel de ambiente nao for configurada', async () => {
      const mockScraperUser = {
        id: 'scraper-uuid-123',
        email: 'scraper@aimatcher.com',
      };
      mockPrismaService.usuario.findUnique.mockResolvedValue(mockScraperUser);
      mockConfigService.get.mockReturnValue(undefined); // Sem config
      mockVagaRepository.expirarVagasAntigas.mockResolvedValue(0);

      await cronService.handleVacancyExpiration();

      const dataLimiteChamada =
        mockVagaRepository.expirarVagasAntigas.mock.calls[0][1];
      const vinteUmDiasAtras = new Date();
      vinteUmDiasAtras.setDate(vinteUmDiasAtras.getDate() - 21);

      expect(
        Math.abs(dataLimiteChamada.getTime() - vinteUmDiasAtras.getTime()),
      ).toBeLessThan(1000);
    });

    it('deve abortar e registrar aviso se o usuario virtual scraper nao for encontrado', async () => {
      mockPrismaService.usuario.findUnique.mockResolvedValue(null);
      const loggerWarnSpy = jest.spyOn((cronService as any).logger, 'warn');

      await cronService.handleVacancyExpiration();

      expect(mockPrismaService.usuario.findUnique).toHaveBeenCalledWith({
        where: { email: 'scraper@aimatcher.com' },
      });
      expect(mockVagaRepository.expirarVagasAntigas).not.toHaveBeenCalled();
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Usuário virtual 'scraper@aimatcher.com' não encontrado",
        ),
      );
    });
  });
});
