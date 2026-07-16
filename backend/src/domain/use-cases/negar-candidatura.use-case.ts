// src/domain/use-cases/negar-candidatura.use-case.ts

import { Injectable } from '@nestjs/common';
import { MatchingRepository } from '../repositories/matching.repository';
import { VagaRepository } from '../repositories/vaga.repository';
import { Matching } from '../entities/matching.entity';

export interface NegarCandidaturaInput {
  usuarioId: string;
  vagaId: string;
  recrutadorId: string;
}

@Injectable()
export class NegarCandidaturaUseCase {
  constructor(
    private readonly matchingRepository: MatchingRepository,
    private readonly vagaRepository: VagaRepository,
  ) {}

  async execute(input: NegarCandidaturaInput): Promise<Matching> {
    const vaga = await this.vagaRepository.buscarPorId(input.vagaId);
    if (!vaga) {
      throw new Error('Vaga não encontrada');
    }

    if (vaga.recrutadorId !== input.recrutadorId) {
      throw new Error('Não autorizado a negar candidaturas para esta vaga');
    }

    const matching = await this.matchingRepository.buscar(
      input.usuarioId,
      input.vagaId,
    );
    if (!matching) {
      throw new Error('Candidatura não encontrada');
    }

    matching.status = 'rejeitado';

    return this.matchingRepository.salvar(matching);
  }
}
