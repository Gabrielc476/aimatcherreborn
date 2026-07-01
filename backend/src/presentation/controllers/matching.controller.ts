// src/presentation/controllers/matching.controller.ts

import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ExecutarMatchingUseCase } from '../../domain/use-cases/executar-matching.use-case';
import { MatchingRepository } from '../../domain/repositories/matching.repository';
import { ExecutarMatchingDto } from '../dtos/executar-matching.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('matching')
export class MatchingController {
  constructor(
    private readonly executarMatchingUseCase: ExecutarMatchingUseCase,
    private readonly matchingRepository: MatchingRepository,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('analisar')
  @HttpCode(HttpStatus.OK)
  async analisar(@Body() dto: ExecutarMatchingDto, @Req() req: any) {
    const usuarioId = dto.usuarioId || req.user.userId;

    // Apenas o próprio usuário ou admin pode analisar
    if (usuarioId !== req.user.userId && !req.query.admin) {
      throw new ForbiddenException('Acesso não autorizado');
    }

    const matching = await this.executarMatchingUseCase.execute({
      usuarioId,
      vagaId: dto.vagaId,
    });

    return {
      mensagem: 'Análise de compatibilidade realizada com sucesso',
      matching,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('recalcular/:usuarioId/:vagaId')
  @HttpCode(HttpStatus.OK)
  async recalcular(
    @Param('usuarioId') usuarioId: string,
    @Param('vagaId') vagaId: string,
    @Req() req: any,
  ) {
    if (usuarioId !== req.user.userId && !req.query.admin) {
      throw new ForbiddenException('Acesso não autorizado');
    }

    const matching = await this.executarMatchingUseCase.execute({
      usuarioId,
      vagaId,
    });

    return {
      mensagem: 'Matching recalculado com sucesso',
      matching,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('usuario/:usuarioId')
  @HttpCode(HttpStatus.OK)
  async obterPorUsuario(
    @Param('usuarioId') usuarioId: string,
    @Req() req: any,
    @Query('pagina') pagina = 1,
    @Query('limite') limite = 10,
  ) {
    if (usuarioId !== req.user.userId && !req.query.admin) {
      throw new ForbiddenException('Acesso não autorizado');
    }

    const result = await this.matchingRepository.buscarPorUsuario(
      usuarioId,
      Number(limite),
      Number(pagina),
    );

    return {
      total: result.total,
      pagina: Number(pagina),
      limite: Number(limite),
      matchings: result.matchings,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('vaga/:vagaId')
  @HttpCode(HttpStatus.OK)
  async obterPorVaga(
    @Param('vagaId') vagaId: string,
    @Query('scoreMinimo') scoreMinimo = 0,
    @Query('pagina') pagina = 1,
    @Query('limite') limite = 20,
  ) {
    // Nota: Em produção, verificar se o usuário autenticado é o recrutador da vaga
    const result = await this.matchingRepository.buscarPorVaga(
      vagaId,
      Number(scoreMinimo),
      Number(limite),
      Number(pagina),
    );

    return {
      total: result.total,
      pagina: Number(pagina),
      limite: Number(limite),
      matchings: result.matchings,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':usuarioId/:vagaId')
  @HttpCode(HttpStatus.OK)
  async obterMatching(
    @Param('usuarioId') usuarioId: string,
    @Param('vagaId') vagaId: string,
    @Req() req: any,
  ) {
    if (usuarioId !== req.user.userId && !req.query.admin) {
      throw new ForbiddenException('Acesso não autorizado');
    }

    const matching = await this.matchingRepository.buscar(usuarioId, vagaId);
    if (!matching) {
      throw new NotFoundException('Matching não encontrado');
    }

    return { matching };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':usuarioId/:vagaId')
  @HttpCode(HttpStatus.OK)
  async excluirMatching(
    @Param('usuarioId') usuarioId: string,
    @Param('vagaId') vagaId: string,
    @Req() req: any,
  ) {
    if (usuarioId !== req.user.userId && !req.query.admin) {
      throw new ForbiddenException('Acesso não autorizado');
    }

    const sucesso = await this.matchingRepository.excluir(usuarioId, vagaId);
    if (!sucesso) {
      throw new NotFoundException('Matching não encontrado ou erro ao excluir');
    }

    return {
      mensagem: 'Matching excluído com sucesso',
    };
  }
}
