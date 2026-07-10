// src/presentation/nest-modules/vaga.module.ts

import { Module } from '@nestjs/common';
import { VagaController } from '../controllers/vaga.controller';
import { AnalisarVagaUseCase } from '../../domain/use-cases/analisar-vaga.use-case';
import { ProcessarCurriculoRecrutadorUseCase } from '../../domain/use-cases/processar-curriculo-recrutador.use-case';
import { VagaRepository } from '../../domain/repositories/vaga.repository';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { PDFService } from '../../domain/services/pdf.service';
import { StorageService } from '../../domain/services/storage.service';
import { AIService } from '../../domain/services/ai.service';
import { CryptographyService } from '../../domain/services/cryptography.service';
import { ExecutarMatchingUseCase } from '../../domain/use-cases/executar-matching.use-case';
import { MatchingModule } from './matching.module';

@Module({
  imports: [MatchingModule],
  controllers: [VagaController],
  providers: [
    {
      provide: AnalisarVagaUseCase,
      useFactory: (repo: VagaRepository, ai: AIService) => 
        new AnalisarVagaUseCase(repo, ai),
      inject: [VagaRepository, AIService],
    },
    {
      provide: ProcessarCurriculoRecrutadorUseCase,
      useFactory: (
        usuarioRepo: UsuarioRepository,
        vagaRepo: VagaRepository,
        pdf: PDFService,
        storage: StorageService,
        ai: AIService,
        crypto: CryptographyService,
        executarMatching: ExecutarMatchingUseCase,
      ) => new ProcessarCurriculoRecrutadorUseCase(
        usuarioRepo,
        vagaRepo,
        pdf,
        storage,
        ai,
        crypto,
        executarMatching,
      ),
      inject: [
        UsuarioRepository,
        VagaRepository,
        PDFService,
        StorageService,
        AIService,
        CryptographyService,
        ExecutarMatchingUseCase,
      ],
    },
  ],
})
export class VagaModule {}
