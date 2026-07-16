// src/infrastructure/database/repositories/prisma-job-processamento.repository.ts
import { Injectable } from '@nestjs/common';
import { JobProcessamento } from '@prisma/client';
import { JobProcessamentoRepository } from '../../../domain/repositories/job-processamento.repository';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaJobProcessamentoRepository implements JobProcessamentoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(data: {
    tipo: string;
    status: string;
    vagaId?: string;
    usuarioId?: string;
    totalItens?: number;
    passoAtual?: string;
    mensagem?: string;
  }): Promise<JobProcessamento> {
    return this.prisma.jobProcessamento.create({
      data: {
        tipo: data.tipo,
        status: data.status,
        vagaId: data.vagaId,
        usuarioId: data.usuarioId,
        totalItens: data.totalItens ?? 1,
        passoAtual: data.passoAtual,
        mensagem: data.mensagem,
      },
    });
  }

  async atualizar(
    id: string,
    data: {
      status?: string;
      passoAtual?: string;
      mensagem?: string;
      itensProcessados?: number;
      resultado?: any;
    },
  ): Promise<JobProcessamento> {
    return this.prisma.jobProcessamento.update({
      where: { id },
      data: {
        status: data.status,
        passoAtual: data.passoAtual,
        mensagem: data.mensagem,
        itensProcessados: data.itensProcessados,
        resultado: data.resultado,
      },
    });
  }

  async buscarPorId(id: string): Promise<JobProcessamento | null> {
    return this.prisma.jobProcessamento.findUnique({
      where: { id },
    });
  }

  async buscarPorVaga(vagaId: string): Promise<JobProcessamento[]> {
    return this.prisma.jobProcessamento.findMany({
      where: { vagaId },
      orderBy: { criadoEm: 'desc' },
    });
  }
}
