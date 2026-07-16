import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ExecutarMatchingUseCase } from '../../domain/use-cases/executar-matching.use-case';
import { NegarCandidaturaUseCase } from '../../domain/use-cases/negar-candidatura.use-case';
import { MatchingRepository } from '../../domain/repositories/matching.repository';
import { VagaRepository } from '../../domain/repositories/vaga.repository';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { StorageService } from '../../domain/services/storage.service';
import { ExecutarMatchingDto } from '../dtos/executar-matching.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { JobProcessamentoRepository } from '../../domain/repositories/job-processamento.repository';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Controller('matching')
export class MatchingController {
  constructor(
    private readonly executarMatchingUseCase: ExecutarMatchingUseCase,
    private readonly negarCandidaturaUseCase: NegarCandidaturaUseCase,
    private readonly matchingRepository: MatchingRepository,
    private readonly vagaRepository: VagaRepository,
    private readonly usuarioRepository: UsuarioRepository,
    private readonly storageService: StorageService,
    private readonly jobRepository: JobProcessamentoRepository,
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

    // 1. Cria o job com status PENDENTE
    const job = await this.jobRepository.criar({
      tipo: 'MATCH_CANDIDATO',
      status: 'PENDENTE',
      vagaId: dto.vagaId,
      usuarioId,
      totalItens: 1,
      passoAtual: 'inicializado',
      mensagem: 'Iniciando análise de compatibilidade...',
    });

    // 2. Inicia o processamento em segundo plano mantendo a sessão RLS
    PrismaService.als.run({ userId: req.user.userId }, () => {
      Promise.resolve().then(async () => {
        try {
          await this.executarMatchingUseCase.execute({
            usuarioId,
            vagaId: dto.vagaId,
          }, job.id);
        } catch (err) {
          console.error(`Erro ao rodar matching assíncrono no job ${job.id}:`, err);
        }
      });
    });

    return {
      mensagem: 'Análise de compatibilidade iniciada em segundo plano',
      jobId: job.id,
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

    // 1. Cria o job
    const job = await this.jobRepository.criar({
      tipo: 'MATCH_CANDIDATO',
      status: 'PENDENTE',
      vagaId,
      usuarioId,
      totalItens: 1,
      passoAtual: 'inicializado',
      mensagem: 'Iniciando recalculo de compatibilidade...',
    });

    // 2. Inicia o processamento em segundo plano
    PrismaService.als.run({ userId: req.user.userId }, () => {
      Promise.resolve().then(async () => {
        try {
          await this.executarMatchingUseCase.execute({
            usuarioId,
            vagaId,
          }, job.id);
        } catch (err) {
          console.error(`Erro ao rodar recalculo assíncrono no job ${job.id}:`, err);
        }
      });
    });

    return {
      mensagem: 'Recalculo de compatibilidade iniciado em segundo plano',
      jobId: job.id,
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
    @Req() req: any,
    @Query('scoreMinimo') scoreMinimo = 0,
    @Query('pagina') pagina = 1,
    @Query('limite') limite = 20,
  ) {
    const vaga = await this.vagaRepository.buscarPorId(vagaId);
    if (!vaga) {
      throw new NotFoundException('Vaga não encontrada');
    }

    if (vaga.recrutadorId !== req.user.userId && !req.query.admin) {
      throw new ForbiddenException('Acesso não autorizado');
    }

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
    const vaga = await this.vagaRepository.buscarPorId(vagaId);
    const isRecrutador = vaga?.recrutadorId === req.user.userId;

    if (usuarioId !== req.user.userId && !isRecrutador && !req.query.admin) {
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

  @UseGuards(JwtAuthGuard)
  @Post(':usuarioId/:vagaId/negar')
  @HttpCode(HttpStatus.OK)
  async negarCandidatura(
    @Param('usuarioId') usuarioId: string,
    @Param('vagaId') vagaId: string,
    @Req() req: any,
  ) {
    try {
      const matching = await this.negarCandidaturaUseCase.execute({
        usuarioId,
        vagaId,
        recrutadorId: req.user.userId,
      });

      return {
        mensagem: 'Candidatura negada com sucesso',
        matching,
      };
    } catch (error: any) {
      if (
        error.message.includes('não encontrada') ||
        error.message.includes('não encontrado') ||
        error.message.includes('Não encontrada')
      ) {
        throw new NotFoundException(error.message);
      }
      if (error.message.includes('Não autorizado')) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':usuarioId/:vagaId/curriculo')
  @HttpCode(HttpStatus.OK)
  async obterCurriculoUrl(
    @Param('usuarioId') usuarioId: string,
    @Param('vagaId') vagaId: string,
    @Req() req: any,
  ) {
    const vaga = await this.vagaRepository.buscarPorId(vagaId);
    const isRecrutador = vaga?.recrutadorId === req.user.userId;

    if (usuarioId !== req.user.userId && !isRecrutador && !req.query.admin) {
      throw new ForbiddenException('Acesso não autorizado');
    }

    const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
    if (!usuario || !usuario.curriculoUrl) {
      throw new NotFoundException('Currículo não encontrado');
    }

    const url = await this.storageService.obterUrlDownload(
      usuario.curriculoUrl,
    );

    return { url };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':usuarioId/:vagaId/status')
  @HttpCode(HttpStatus.OK)
  async atualizarStatus(
    @Param('usuarioId') usuarioId: string,
    @Param('vagaId') vagaId: string,
    @Body('status') status: string,
    @Req() req: any,
  ) {
    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
    const vaga = await this.vagaRepository.buscarPorId(vagaId);
    if (!vaga) {
      throw new NotFoundException('Vaga não encontrada');
    }

    const isRecrutador = vaga.recrutadorId === req.user.userId;
    if (!isRecrutador && !req.query.admin) {
      throw new ForbiddenException('Acesso não autorizado');
    }

    const matching = await this.matchingRepository.buscar(usuarioId, vagaId);
    if (!matching) {
      throw new NotFoundException('Candidatura não encontrada');
    }

    matching.status = status;
    const matchingSalvo = await this.matchingRepository.salvar(matching);

    return {
      mensagem: 'Status da candidatura atualizado com sucesso',
      matching: matchingSalvo,
    };
  }
}
