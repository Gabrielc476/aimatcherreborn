// src/domain/repositories/job-processamento.repository.ts
import { JobProcessamento } from '@prisma/client';

export abstract class JobProcessamentoRepository {
  abstract criar(data: {
    tipo: string;
    status: string;
    vagaId?: string;
    usuarioId?: string;
    totalItens?: number;
    passoAtual?: string;
    mensagem?: string;
  }): Promise<JobProcessamento>;

  abstract atualizar(
    id: string,
    data: {
      status?: string;
      passoAtual?: string;
      mensagem?: string;
      itensProcessados?: number;
      resultado?: any;
    },
  ): Promise<JobProcessamento>;

  abstract buscarPorId(id: string): Promise<JobProcessamento | null>;

  abstract buscarPorVaga(vagaId: string): Promise<JobProcessamento[]>;
}
