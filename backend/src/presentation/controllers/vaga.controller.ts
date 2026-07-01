// src/presentation/controllers/vaga.controller.ts

import { Controller, Post, Get, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { AnalisarVagaUseCase } from '../../domain/use-cases/analisar-vaga.use-case';
import { VagaRepository } from '../../domain/repositories/vaga.repository';
import { AdicionarVagaDto } from '../dtos/adicionar-vaga.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('vaga')
export class VagaController {
  constructor(
    private readonly analisarVagaUseCase: AnalisarVagaUseCase,
    private readonly vagaRepository: VagaRepository,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('adicionar')
  @HttpCode(HttpStatus.CREATED)
  async adicionar(@Body() dto: AdicionarVagaDto, @Req() req: any) {
    const vaga = await this.analisarVagaUseCase.execute({
      recrutadorId: req.user.userId,
      textoVaga: dto.textoVaga,
      empresaNome: dto.empresaNome,
      localizacao: dto.localizacao,
    });

    return {
      mensagem: 'Vaga analisada e cadastrada com sucesso',
      vagaId: vaga.id,
      vaga,
    };
  }

  @Get('listar')
  @HttpCode(HttpStatus.OK)
  async listar(
    @Query('pagina') pagina = 1,
    @Query('limite') limite = 20,
  ) {
    const result = await this.vagaRepository.listarAtivas(Number(limite), Number(pagina));
    
    return {
      total: result.total,
      pagina: Number(pagina),
      limite: Number(limite),
      vagas: result.vagas,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async obterPorId(@Param('id') id: string) {
    const vaga = await this.vagaRepository.buscarPorId(id);
    if (!vaga) {
      throw new NotFoundException('Vaga não encontrada');
    }
    
    return { vaga };
  }
}
