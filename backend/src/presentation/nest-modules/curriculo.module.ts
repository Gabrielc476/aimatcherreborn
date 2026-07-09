// src/presentation/nest-modules/curriculo.module.ts

import { Module } from '@nestjs/common';
import { CurriculoController } from '../controllers/curriculo.controller';
import { CurriculoOtimizadoController } from '../controllers/curriculo-otimizado.controller';
import { ProcessarCurriculoUseCase } from '../../domain/use-cases/processar-curriculo.use-case';
import { OtimizarCurriculoUseCase } from '../../domain/use-cases/otimizar-curriculo.use-case';
import { PythonPdfGeneratorService } from '../../infrastructure/pdf/pdf-generator.service';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { VagaRepository } from '../../domain/repositories/vaga.repository';
import { PDFService } from '../../domain/services/pdf.service';
import { StorageService } from '../../domain/services/storage.service';
import { AIService } from '../../domain/services/ai.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Module({
  controllers: [
    CurriculoController, 
    CurriculoOtimizadoController
  ],
  providers: [
    PythonPdfGeneratorService,
    {
      provide: OtimizarCurriculoUseCase,
      useFactory: (
        usuarioRepo: UsuarioRepository,
        vagaRepo: VagaRepository,
        ai: AIService,
        prisma: PrismaService,
      ) => new OtimizarCurriculoUseCase(usuarioRepo, vagaRepo, ai, prisma),
      inject: [UsuarioRepository, VagaRepository, AIService, PrismaService],
    },
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
