// src/presentation/nest-modules/matching.module.ts

import { Module } from '@nestjs/common';
import { MatchingController } from '../controllers/matching.controller';
import { ExecutarMatchingUseCase } from '../../domain/use-cases/executar-matching.use-case';
import { MatchingRepository } from '../../domain/repositories/matching.repository';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { VagaRepository } from '../../domain/repositories/vaga.repository';
import { AIService } from '../../domain/services/ai.service';

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
      ) => new ExecutarMatchingUseCase(matchingRepo, usuarioRepo, vagaRepo, ai),
      inject: [MatchingRepository, UsuarioRepository, VagaRepository, AIService],
    },
  ],
})
export class MatchingModule {}
