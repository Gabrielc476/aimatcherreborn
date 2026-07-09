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
  titulo?: string;
  modalidade?: string;
  tipoContrato?: string;
  nivel?: string;
  link?: string;
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

    let dadosEstruturados: any = {};
    let palavrasChave: string[] = [];
    let resumo = '';

    // 1. Chama a IA para estruturar a descrição da vaga
    console.log('[AnalisarVagaUseCase] Descrição recebida pela IA para extração:', input.textoVaga);
    try {
      dadosEstruturados = await this.aiService.extrairEstruturaVaga(input.textoVaga);
    } catch (err) {
      console.error('[AnalisarVagaUseCase] Erro ao extrair estrutura com a IA (usando fallbacks):', err);
      dadosEstruturados = {
        titulo: input.titulo,
        resumo: input.textoVaga.substring(0, 250),
        requisitos: {
          habilidades_tecnicas: [],
          habilidades_comportamentais: [],
          idiomas: [],
        },
        palavras_chave: [],
      };
    }

    // 2. Garante palavras-chave
    try {
      palavrasChave = dadosEstruturados.palavras_chave || [];
      if (palavrasChave.length < 5) {
        palavrasChave = await this.aiService.gerarPalavrasChave(dadosEstruturados);
      }
    } catch (err) {
      console.error('[AnalisarVagaUseCase] Erro ao gerar palavras-chave com a IA:', err);
      const termos = `${input.titulo || ''} ${input.empresaNome || ''} ${input.nivel || ''}`.split(/\s+/);
      palavrasChave = Array.from(new Set(termos.filter(t => t.length > 3))).slice(0, 10);
    }

    // 3. Garante resumo
    try {
      resumo = dadosEstruturados.resumo || '';
      if (!resumo) {
        resumo = await this.aiService.gerarResumoVaga(dadosEstruturados);
      }
    } catch (err) {
      console.error('[AnalisarVagaUseCase] Erro ao gerar resumo com a IA:', err);
      resumo = input.textoVaga.substring(0, 280) + '...';
    }

    // 4. Cria a entidade Vaga com os overrides do scraper
    const vaga = new Vaga(
      randomUUID(),
      input.recrutadorId,
      input.titulo || dadosEstruturados.titulo || 'Vaga Sem Título',
      input.textoVaga,
      'ativa',
      input.empresaNome || dadosEstruturados.empresa?.nome || 'Empresa Confidencial',
      (input.modalidade || dadosEstruturados.modalidade || 'PRESENCIAL') as any,
      input.tipoContrato || dadosEstruturados.tipo_contrato || 'CLT',
      input.nivel || dadosEstruturados.nivel || 'Pleno',
      new Date(),
      resumo,
      input.localizacao || dadosEstruturados.localizacao?.cidade || '',
      dadosEstruturados.faixa_salarial?.minimo ? Number(dadosEstruturados.faixa_salarial.minimo) : undefined,
      dadosEstruturados.faixa_salarial?.maximo ? Number(dadosEstruturados.faixa_salarial.maximo) : undefined,
      dadosEstruturados.requisitos as RequisitosVaga,
      palavrasChave,
      input.link,
    );

    // 5. Salva no banco de dados
    return this.vagaRepository.salvar(vaga);
  }
}
