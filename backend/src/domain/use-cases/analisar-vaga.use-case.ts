// src/domain/use-cases/analisar-vaga.use-case.ts

import { randomUUID } from 'crypto';
import { Vaga, RequisitosVaga } from '../entities/vaga.entity';
import { VagaRepository } from '../repositories/vaga.repository';
import { AIService } from '../services/ai.service';

export interface AnalisarVagaInput {
  recrutadorId: string;
  textoVaga: string;
  empresaNome?: string;
  localizacao?: string;
}

export class AnalisarVagaUseCase {
  constructor(
    private readonly vagaRepository: VagaRepository,
    private readonly aiService: AIService,
  ) {}

  async execute(input: AnalisarVagaInput): Promise<Vaga> {
    if (!input.textoVaga || !input.textoVaga.trim()) {
      throw new Error('O texto da vaga é obrigatório');
    }

    // 1. Chama a IA para estruturar a descrição da vaga
    const dadosEstruturados = await this.aiService.extrairEstruturaVaga(input.textoVaga);

    // 2. Garante palavras-chave
    let palavrasChave = dadosEstruturados.palavras_chave || [];
    if (palavrasChave.length < 5) {
      palavrasChave = await this.aiService.gerarPalavrasChave(dadosEstruturados);
    }

    // 3. Garante resumo
    let resumo = dadosEstruturados.resumo || '';
    if (!resumo) {
      resumo = await this.aiService.gerarResumoVaga(dadosEstruturados);
    }

    // 4. Cria a entidade Vaga
    const vaga = new Vaga(
      randomUUID(),
      input.recrutadorId,
      dadosEstruturados.titulo || 'Vaga Sem Título',
      input.textoVaga,
      'ativa',
      input.empresaNome || dadosEstruturados.empresa?.nome || 'Empresa Confidencial',
      dadosEstruturados.modalidade || 'PRESENCIAL',
      dadosEstruturados.tipo_contrato || 'CLT',
      dadosEstruturados.nivel || 'Pleno',
      new Date(),
      resumo,
      input.localizacao || dadosEstruturados.localizacao?.cidade || '',
      dadosEstruturados.faixa_salarial?.minimo ? Number(dadosEstruturados.faixa_salarial.minimo) : undefined,
      dadosEstruturados.faixa_salarial?.maximo ? Number(dadosEstruturados.faixa_salarial.maximo) : undefined,
      dadosEstruturados.requisitos as RequisitosVaga,
      palavrasChave,
    );

    // 5. Salva no banco de dados
    return this.vagaRepository.salvar(vaga);
  }
}
