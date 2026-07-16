// src/presentation/nest-modules/matching.module.ts

import { Module } from '@nestjs/common';
import { MatchingController } from '../controllers/matching.controller';
import { ExecutarMatchingUseCase } from '../../domain/use-cases/executar-matching.use-case';
import { NegarCandidaturaUseCase } from '../../domain/use-cases/negar-candidatura.use-case';
import { MatchingRepository } from '../../domain/repositories/matching.repository';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { VagaRepository } from '../../domain/repositories/vaga.repository';
import { AIService } from '../../domain/services/ai.service';

import { JobEventsService } from '../../domain/services/job-events.service';
import { JobProcessamentoRepository } from '../../domain/repositories/job-processamento.repository';

@Module({
  controllers: [MatchingController],
  providers: [
    {
      provide: ExecutarMatchingUseCase,
      useFactory: (
        matchingRepo: MatchingRepository,
        usuarioRepo: UsuarioRepository,
        vagaRepo: VagaRepository,
        ai: AIService,
        jobRepo: JobProcessamentoRepository,
        jobEvents: JobEventsService,
      ) => new ExecutarMatchingUseCase(matchingRepo, usuarioRepo, vagaRepo, ai, jobRepo, jobEvents),
      inject: [
        MatchingRepository,
        UsuarioRepository,
        VagaRepository,
        AIService,
        JobProcessamentoRepository,
        JobEventsService,
      ],
    },
    {
      provide: NegarCandidaturaUseCase,
      useFactory: (
        matchingRepo: MatchingRepository,
        vagaRepo: VagaRepository,
      ) => new NegarCandidaturaUseCase(matchingRepo, vagaRepo),
      inject: [MatchingRepository, VagaRepository],
    },
  ],
  exports: [ExecutarMatchingUseCase, NegarCandidaturaUseCase],
})
export class MatchingModule {}
