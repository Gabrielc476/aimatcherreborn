// src/presentation/controllers/curriculo.controller.ts

import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, Req, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProcessarCurriculoUseCase } from '../../domain/use-cases/processar-curriculo.use-case';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('curriculo')
export class CurriculoController {
  constructor(private readonly processarCurriculoUseCase: ProcessarCurriculoUseCase) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('curriculo'))
  @HttpCode(HttpStatus.CREATED)
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

    const resultado = await this.processarCurriculoUseCase.execute({
      userId: req.user.userId,
      fileBuffer: file.buffer,
      fileName: file.originalname,
    });

    return resultado;
  }
}
