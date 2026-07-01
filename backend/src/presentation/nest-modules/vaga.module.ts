// src/presentation/nest-modules/vaga.module.ts

import { Module } from '@nestjs/common';
import { VagaController } from '../controllers/vaga.controller';
import { AnalisarVagaUseCase } from '../../domain/use-cases/analisar-vaga.use-case';
import { VagaRepository } from '../../domain/repositories/vaga.repository';
import { AIService } from '../../domain/services/ai.service';

@Module({
  controllers: [VagaController],
  providers: [
    {
      provide: AnalisarVagaUseCase,
      useFactory: (repo: VagaRepository, ai: AIService) => 
        new AnalisarVagaUseCase(repo, ai),
      inject: [VagaRepository, AIService],
    },
  ],
})
export class VagaModule {}
