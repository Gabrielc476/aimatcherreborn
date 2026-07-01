// src/domain/use-cases/executar-matching.use-case.ts

import { randomUUID } from 'crypto';
import { Matching } from '../entities/matching.entity';
import { MatchingRepository } from '../repositories/matching.repository';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { VagaRepository } from '../repositories/vaga.repository';
import { AIService } from '../services/ai.service';

export interface ExecutarMatchingInput {
  usuarioId: string;
  vagaId: string;
}

export class ExecutarMatchingUseCase {
  constructor(
    private readonly matchingRepository: MatchingRepository,
    private readonly usuarioRepository: UsuarioRepository,
    private readonly vagaRepository: VagaRepository,
    private readonly aiService: AIService,
  ) {}

  async execute(input: ExecutarMatchingInput): Promise<Matching> {
    // 1. Busca o usuário/candidato
    const usuario = await this.usuarioRepository.buscarPorId(input.usuarioId);
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    if (!usuario.curriculoExtraido) {
      throw new Error('O usuário não possui um currículo processado');
    }

    // 2. Busca a vaga
    const vaga = await this.vagaRepository.buscarPorId(input.vagaId);
    if (!vaga) {
      throw new Error('Vaga não encontrada');
    }

    // 3. Executa a análise de compatibilidade via IA (Gemma 4 / Gemini)
    const resultadoAnalise = await this.aiService.analisarCompatibilidade(
      usuario.curriculoExtraido,
      vaga,
    );

    // 4. Cria a entidade Matching
    const matching = new Matching(
      randomUUID(),
      usuario.id,
      vaga.id,
      resultadoAnalise.score,
      resultadoAnalise,
      new Date(),
    );

    // 5. Salva o resultado no repositório
    return this.matchingRepository.salvar(matching);
  }
}
