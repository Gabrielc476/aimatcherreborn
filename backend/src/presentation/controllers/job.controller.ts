// src/presentation/controllers/job.controller.ts
import {
  Controller,
  Get,
  Param,
  Sse,
  MessageEvent,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JobEventsService } from '../../domain/services/job-events.service';
import { JobProcessamentoRepository } from '../../domain/repositories/job-processamento.repository';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('jobs')
export class JobController {
  constructor(
    private readonly jobEventsService: JobEventsService,
    private readonly jobRepository: JobProcessamentoRepository,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('vaga/:vagaId')
  async listarPorVaga(@Param('vagaId') vagaId: string) {
    return this.jobRepository.buscarPorVaga(vagaId);
  }

  @UseGuards(JwtAuthGuard)
  @Sse(':id/stream')
  async streamJob(@Param('id') id: string): Promise<Observable<MessageEvent>> {
    const job = await this.jobRepository.buscarPorId(id);
    if (!job) {
      throw new NotFoundException('Job não encontrado');
    }

    const liveEvents = this.jobEventsService.on(id);

    return new Observable<MessageEvent>((subscriber) => {
      // Envia o estado atual do banco imediatamente no primeiro evento
      subscriber.next({
        data: {
          id: job.id,
          status: job.status,
          passoAtual: job.passoAtual,
          mensagem: job.mensagem,
          totalItens: job.totalItens,
          itensProcessados: job.itensProcessados,
          resultado: job.resultado,
        },
      } as MessageEvent);

      // Assina para atualizações em tempo real subsequentes
      const subscription = liveEvents.subscribe({
        next(val) {
          subscriber.next({ data: val } as MessageEvent);
        },
        error(err) {
          subscriber.error(err);
        },
        complete() {
          subscriber.complete();
        },
      });

      return () => {
        subscription.unsubscribe();
      };
    });
  }
}
