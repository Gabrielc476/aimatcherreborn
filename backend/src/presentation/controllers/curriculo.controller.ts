// src/presentation/controllers/curriculo.controller.ts

import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProcessarCurriculoUseCase } from '../../domain/use-cases/processar-curriculo.use-case';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { JobProcessamentoRepository } from '../../domain/repositories/job-processamento.repository';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Controller('curriculo')
export class CurriculoController {
  constructor(
    private readonly processarCurriculoUseCase: ProcessarCurriculoUseCase,
    private readonly jobRepository: JobProcessamentoRepository,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('curriculo'))
  @HttpCode(HttpStatus.ACCEPTED)
  async uploadCurriculo(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    if (!file.originalname.toLowerCase().endsWith('.pdf')) {
      throw new BadRequestException('O arquivo deve ter extensão .pdf');
    }

    // Limite de 5MB
    const maxTamanho = 5 * 1024 * 1024;
    if (file.size > maxTamanho) {
      throw new BadRequestException('O arquivo excede o tamanho máximo de 5MB');
    }

    const userId = req.user.userId;

    // 1. Cria o job no banco de dados com status PENDENTE
    const job = await this.jobRepository.criar({
      tipo: 'CV_CANDIDATO',
      status: 'PENDENTE',
      usuarioId: userId,
      passoAtual: 'inicializado',
      mensagem: 'Iniciando processamento do currículo...',
    });

    // 2. Inicia o processamento em segundo plano mantendo a sessão RLS
    PrismaService.als.run({ userId }, () => {
      this.processarCurriculoUseCase.execute(
        {
          userId,
          fileBuffer: file.buffer,
          fileName: file.originalname,
        },
        job.id,
      ).catch((err) => {
        console.error(`Erro em segundo plano no processamento do job ${job.id}:`, err);
      });
    });

    // 3. Retorna o ID do job imediatamente para o cliente
    return {
      jobId: job.id,
      mensagem: 'Processamento do currículo iniciado em segundo plano',
    };
  }
}
