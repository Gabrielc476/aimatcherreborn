import { Controller, Post, Get, Body, Param, Req, UseGuards, Res, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { IsString, IsOptional, IsUUID, IsArray } from 'class-validator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OtimizarCurriculoUseCase } from '../../domain/use-cases/otimizar-curriculo.use-case';
import { PythonPdfGeneratorService } from '../../infrastructure/pdf/pdf-generator.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { VagaRepository } from '../../domain/repositories/vaga.repository';
import { AIService } from '../../domain/services/ai.service';

export class OtimizarCurriculoDto {
  @IsUUID()
  @IsOptional()
  vagaId?: string;

  @IsString()
  @IsOptional()
  vagaDescricao?: string;

  @IsString()
  @IsOptional()
  tituloPersonalizado?: string;
}

export class ExportarPdfDto {
  @IsString()
  @IsOptional()
  resumoProfissional?: string;

  @IsOptional()
  experiencias?: any;

  @IsOptional()
  habilidades?: string[];

  @IsOptional()
  projetos?: any;

  @IsOptional()
  certificacoes?: any;

  @IsOptional()
  idiomas?: any;

  @IsOptional()
  formacoes?: any;
}

export class SimularMatchingDto {
  @IsUUID()
  vagaId: string;

  @IsString()
  resumoProfissional: string;

  @IsOptional()
  experiencias?: any;

  @IsOptional()
  habilidades?: string[];

  @IsOptional()
  projetos?: any;

  @IsOptional()
  certificacoes?: any;

  @IsOptional()
  idiomas?: any;

  @IsOptional()
  formacoes?: any;
}

@Controller('curriculo')
@UseGuards(JwtAuthGuard)
export class CurriculoOtimizadoController {
  constructor(
    private readonly otimizarCurriculoUseCase: OtimizarCurriculoUseCase,
    private readonly pdfGeneratorService: PythonPdfGeneratorService,
    private readonly prisma: PrismaService,
    private readonly usuarioRepository: UsuarioRepository,
    private readonly vagaRepository: VagaRepository,
    private readonly aiService: AIService,
  ) {}

  @Post('otimizar')
  @HttpCode(HttpStatus.CREATED)
  async otimizar(
    @Req() req: any,
    @Body() dto: OtimizarCurriculoDto,
  ) {
    const userId = req.user.userId;
    const resultado = await this.otimizarCurriculoUseCase.execute({
      usuarioId: userId,
      vagaId: dto.vagaId,
      vagaDescricao: dto.vagaDescricao,
      tituloPersonalizado: dto.tituloPersonalizado,
    });
    return resultado;
  }

  @Get('otimizados')
  @HttpCode(HttpStatus.OK)
  async listarOtimizados(@Req() req: any) {
    const userId = req.user.userId;
    return this.prisma.runWithRLS(async (tx) => {
      const registros = await tx.curriculoOtimizado.findMany({
        where: { usuarioId: userId },
        orderBy: { dataCriacao: 'desc' }
      });
      return registros;
    });
  }

  @Get('otimizados/:id')
  @HttpCode(HttpStatus.OK)
  async buscarOtimizado(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const userId = req.user.userId;
    const registro = await this.prisma.runWithRLS(async (tx) => {
      return tx.curriculoOtimizado.findFirst({
        where: { id, usuarioId: userId }
      });
    });

    if (!registro) {
      throw new NotFoundException('Currículo otimizado não encontrado');
    }

    return registro;
  }

  @Post('simular-matching')
  @HttpCode(HttpStatus.OK)
  async simularMatching(
    @Req() req: any,
    @Body() body: SimularMatchingDto,
  ) {
    const userId = req.user.userId;

    const vaga = await this.vagaRepository.buscarPorId(body.vagaId);
    if (!vaga) {
      throw new NotFoundException('Vaga não encontrada');
    }

    const user = await this.usuarioRepository.buscarPorId(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const simulatedResume = {
      nome: user.nomeCompleto,
      titulo_profissional: user.perfil?.titulo || 'Profissional de Tecnologia',
      email: user.email,
      telefone: user.telefone || '',
      localizacao: user.preferencias?.cidades?.[0] || '',
      resumo_profissional: body.resumoProfissional,
      experiencias: body.experiencias || [],
      habilidades: body.habilidades || [],
      projetos: body.projetos || [],
      certificacoes: body.certificacoes || [],
      idiomas: body.idiomas || [],
      formacoes: body.formacoes || [],
    };

    const analiseVaga = `Título: ${vaga.titulo}\nDescrição:\n${vaga.descricao}`;
    const result = await this.aiService.analisarCompatibilidade(simulatedResume, analiseVaga);

    return {
      score: result.score || 0,
      analise: result,
    };
  }

  @Post('otimizados/:id/pdf')
  async exportarPdf(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: ExportarPdfDto,
    @Res() res: any,
  ) {
    const userId = req.user.userId;
    
    // 1. Fetch optimized resume
    const optCv = await this.prisma.runWithRLS(async (tx) => {
      return tx.curriculoOtimizado.findFirst({
        where: { id, usuarioId: userId }
      });
    });

    if (!optCv) {
      throw new NotFoundException('Currículo otimizado não encontrado');
    }

    // 2. Fetch original user profile for contact information
    const user = await this.usuarioRepository.buscarPorId(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // 3. Prepare payload for the Python pdf_generator script
    const payload = {
      nome: user.nomeCompleto,
      titulo_profissional: user.perfil?.titulo || 'Profissional de Tecnologia',
      email: user.email,
      telefone: user.telefone || '',
      localizacao: user.preferencias?.cidades?.[0] || '',
      resumo_profissional: body?.resumoProfissional || optCv.resumoProfissional,
      experiencias: body?.experiencias || optCv.experiencias,
      habilidades: body?.habilidades || optCv.habilidades,
      projetos: body?.projetos || optCv.projetos,
      certificacoes: body?.certificacoes || optCv.certificacoes || [],
      idiomas: body?.idiomas || optCv.idiomas || [],
      formacoes: body?.formacoes || optCv.formacoes || [],
    };

    // 4. Render and generate PDF buffer
    try {
      const pdfBuffer = await this.pdfGeneratorService.renderToPdf(payload);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="curriculo_otimizado_${id}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      return res.send(pdfBuffer);
    } catch (err: any) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        mensagem: 'Erro ao gerar o PDF do currículo',
        erro: err.message || err
      });
    }
  }
}
