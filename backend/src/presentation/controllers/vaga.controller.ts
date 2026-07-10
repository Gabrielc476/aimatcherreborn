import { Controller, Post, Get, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus, NotFoundException, UnauthorizedException, BadRequestException, ForbiddenException, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AnalisarVagaUseCase } from '../../domain/use-cases/analisar-vaga.use-case';
import { ProcessarCurriculoRecrutadorUseCase } from '../../domain/use-cases/processar-curriculo-recrutador.use-case';
import { VagaRepository } from '../../domain/repositories/vaga.repository';
import { AdicionarVagaDto } from '../dtos/adicionar-vaga.dto';
import { IntegrarVagaExternaDto } from '../dtos/integrar-vaga-externa.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Controller('vaga')
export class VagaController {
  constructor(
    private readonly analisarVagaUseCase: AnalisarVagaUseCase,
    private readonly processarCurriculoRecrutadorUseCase: ProcessarCurriculoRecrutadorUseCase,
    private readonly vagaRepository: VagaRepository,
    private readonly prisma: PrismaService,
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
      link: dto.link,
    });

    return {
      mensagem: 'Vaga analisada e cadastrada com sucesso',
      vagaId: vaga.id,
      vaga,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('minhas-vagas')
  @HttpCode(HttpStatus.OK)
  async minhasVagas(
    @Req() req: any,
    @Query('pagina') pagina = 1,
    @Query('limite') limite = 20,
  ) {
    const result = await this.vagaRepository.buscarPorRecrutador(
      req.user.userId,
      Number(limite),
      Number(pagina)
    );
    return {
      total: result.total,
      pagina: Number(pagina),
      limite: Number(limite),
      vagas: result.vagas,
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

  @Post('integrar-externo')
  @HttpCode(HttpStatus.CREATED)
  async integrarExterno(
    @Body() dto: IntegrarVagaExternaDto,
    @Req() req: any,
  ) {
    // 1. Valida o Token de Segurança
    const systemToken = req.headers['x-scraper-token'];
    const expectedToken = process.env.SCRAPER_API_TOKEN;
    
    if (!expectedToken || systemToken !== expectedToken) {
      throw new UnauthorizedException('Token de integração inválido ou não fornecido');
    }

    // 2. Busca ou Cria o usuário virtual 'Scraper'
    const scraperEmail = 'scraper@aimatcher.com';
    let scraperUser = await this.prisma.usuario.findUnique({
      where: { email: scraperEmail },
    });

    if (!scraperUser) {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('scraper_system_token_123', 10);
      scraperUser = await this.prisma.usuario.create({
        data: {
          nomeCompleto: 'Robô Scraper',
          email: scraperEmail,
          senhaHash: hash,
          status: 'ATIVO',
        },
      });
    }

    const scraperUserId = scraperUser.id;

    // 3. Executa o Caso de Uso dentro do contexto de RLS do usuário 'Scraper'
    const vaga = await PrismaService.als.run({ userId: scraperUserId }, async () => {
      const duasSemanasAtras = new Date();
      duasSemanasAtras.setDate(duasSemanasAtras.getDate() - 14);

      const vagaDuplicada = await this.prisma.runWithRLS(async (tx) => {
        return tx.vaga.findFirst({
          where: {
            titulo: dto.titulo,
            empresaNome: dto.empresaNome,
            recrutadorId: scraperUserId,
            dataCriacao: {
              gt: duasSemanasAtras,
            },
          },
        });
      });

      if (vagaDuplicada) {
        return vagaDuplicada;
      }

      return this.analisarVagaUseCase.execute({
        recrutadorId: scraperUserId,
        textoVaga: dto.descricao,
        empresaNome: dto.empresaNome,
        localizacao: dto.localizacao,
        titulo: dto.titulo,
        modalidade: dto.modalidade,
        tipoContrato: dto.tipoContrato,
        nivel: dto.nivel,
        link: dto.link,
      });
    });

    return {
      mensagem: 'Vaga integrada e estruturada com sucesso',
      vagaId: vaga.id,
      vaga,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/candidatos/lote')
  @UseInterceptors(FilesInterceptor('curriculos'))
  @HttpCode(HttpStatus.OK)
  async uploadCurriculosLote(
    @Param('id') vagaId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    // 1. Verifica se a vaga existe e se pertence ao recrutador logado
    const vaga = await this.vagaRepository.buscarPorId(vagaId);
    if (!vaga) {
      throw new NotFoundException('Vaga não encontrada');
    }

    if (vaga.recrutadorId !== req.user.userId && !req.query.admin) {
      throw new ForbiddenException('Acesso não autorizado a esta vaga');
    }

    const sucessos = [];
    const falhas = [];

    // 2. Processa cada arquivo sequencialmente para evitar sobrecarregar a IA/Storage
    for (const file of files) {
      if (!file.originalname.toLowerCase().endsWith('.pdf')) {
        falhas.push({
          arquivo: file.originalname,
          erro: 'O arquivo deve ter extensão .pdf',
        });
        continue;
      }

      // Limite de 5MB por arquivo
      const maxTamanho = 5 * 1024 * 1024;
      if (file.size > maxTamanho) {
        falhas.push({
          arquivo: file.originalname,
          erro: 'O arquivo excede o tamanho máximo de 5MB',
        });
        continue;
      }

      try {
        const matching = await this.processarCurriculoRecrutadorUseCase.execute({
          vagaId,
          fileBuffer: file.buffer,
          fileName: file.originalname,
        });

        sucessos.push({
          arquivo: file.originalname,
          candidato: matching.candidato?.nomeCompleto,
          email: matching.candidato?.email,
          score: matching.score,
        });
      } catch (err) {
        console.error(`Erro ao processar currículo ${file.originalname}:`, err);
        falhas.push({
          arquivo: file.originalname,
          erro: err instanceof Error ? err.message : 'Erro interno de processamento',
        });
      }
    }

    return {
      mensagem: 'Processamento em lote concluído',
      totalProcessados: files.length,
      sucessos,
      falhas,
    };
  }
}
