// src/presentation/nest-modules/curriculo.module.ts

import { Module } from '@nestjs/common';
import { CurriculoController } from '../controllers/curriculo.controller';
import { ProcessarCurriculoUseCase } from '../../domain/use-cases/processar-curriculo.use-case';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { PDFService } from '../../domain/services/pdf.service';
import { StorageService } from '../../domain/services/storage.service';
import { AIService } from '../../domain/services/ai.service';

@Module({
  controllers: [CurriculoController],
  providers: [
    {
      provide: ProcessarCurriculoUseCase,
      useFactory: (
        usuarioRepo: UsuarioRepository,
        pdf: PDFService,
        storage: StorageService,
        ai: AIService,
      ) => new ProcessarCurriculoUseCase(usuarioRepo, pdf, storage, ai),
      inject: [UsuarioRepository, PDFService, StorageService, AIService],
    },
  ],
})
export class CurriculoModule {}
