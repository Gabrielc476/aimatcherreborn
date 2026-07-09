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

    // 3. Pré-calcula os scores de suporte para a IA
    const scoresSuporte = this.calcularScoresSuporte(usuario, vaga);

    // 4. Executa a análise de compatibilidade via IA (Gemma 4 / Gemini)
    const resultadoAnalise = await this.aiService.analisarCompatibilidade(
      usuario.curriculoExtraido,
      vaga,
      scoresSuporte,
    );

    // 5. Cria a entidade Matching
    const matching = new Matching(
      randomUUID(),
      usuario.id,
      vaga.id,
      resultadoAnalise.score,
      resultadoAnalise,
      new Date(),
    );

    // 6. Salva o resultado no repositório
    return this.matchingRepository.salvar(matching);
  }

  private calcularScoresSuporte(usuario: any, vaga: any): { skillScore: number; experienceScore: number; preferenceScore: number } {
    // 1. Habilidades Técnicas
    let skillScore = 100;
    const reqSkills = vaga.requisitos?.habilidadesTecnicas || [];
    if (reqSkills.length > 0) {
      const candSkillsSet = new Set<string>();
      
      // Habilidades cadastradas no domínio
      (usuario.habilidades || []).forEach((h: any) => {
        if (h.nome) candSkillsSet.add(h.nome.toLowerCase().trim());
      });
      
      // Habilidades extraídas do currículo JSON
      (usuario.curriculoExtraido?.habilidades_tecnicas || []).forEach((h: any) => {
        if (h.nome) candSkillsSet.add(h.nome.toLowerCase().trim());
      });

      let totalWeight = 0;
      let matchedWeight = 0;

      reqSkills.forEach((s: any) => {
        if (!s.nome) return;
        const skillName = s.nome.toLowerCase().trim();
        const weight = s.obrigatorio ? 3 : 1;
        totalWeight += weight;

        if (candSkillsSet.has(skillName)) {
          matchedWeight += weight;
        }
      });

      skillScore = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 100;
    }

    // 2. Anos de Experiência
    let experienceScore = 100;
    const tempoMinimo = vaga.requisitos?.experiencia?.tempoMinimo || 0;
    if (tempoMinimo > 0) {
      const anosCandidatoPerfil = usuario.perfil?.anosExperiencia || 0;
      const anosCandidatoExtraido = usuario.curriculoExtraido?.perfil?.anos_experiencia || 0;
      
      let maxAnosSkills = 0;
      (usuario.habilidades || []).forEach((h: any) => {
        if (h.anosExperiencia > maxAnosSkills) maxAnosSkills = h.anosExperiencia;
      });
      (usuario.curriculoExtraido?.habilidades_tecnicas || []).forEach((h: any) => {
        if (h.anos_experiencia > maxAnosSkills) maxAnosSkills = h.anos_experiencia;
      });

      const anosCandidato = Math.max(anosCandidatoPerfil, anosCandidatoExtraido, maxAnosSkills);
      experienceScore = Math.min(100, Math.round((anosCandidato / tempoMinimo) * 100));
    }

    // 3. Preferência/Modalidade de Trabalho
    let preferenceScore = 100;
    const modalidadeVaga = vaga.modalidade;
    if (modalidadeVaga) {
      const prefsCandidato = new Set<string>();
      
      (usuario.preferencias?.modalidades || []).forEach((m: any) => {
        prefsCandidato.add(String(m).toUpperCase().trim());
      });
      
      (usuario.curriculoExtraido?.preferencias?.modalidades || []).forEach((m: any) => {
        prefsCandidato.add(String(m).toUpperCase().trim());
      });

      if (prefsCandidato.size > 0) {
        const modVagaUpper = String(modalidadeVaga).toUpperCase().trim();
        if (prefsCandidato.has(modVagaUpper)) {
          preferenceScore = 100;
        } else {
          if (modVagaUpper === 'HIBRIDO' && prefsCandidato.has('REMOTO')) {
            preferenceScore = 70;
          } else if (modVagaUpper === 'REMOTO' && prefsCandidato.has('HIBRIDO')) {
            preferenceScore = 70;
          } else if (modVagaUpper === 'PRESENCIAL' && prefsCandidato.has('HIBRIDO')) {
            preferenceScore = 50;
          } else if (modVagaUpper === 'HIBRIDO' && prefsCandidato.has('PRESENCIAL')) {
            preferenceScore = 50;
          } else {
            preferenceScore = 20;
          }
        }
      }
    }

    return { skillScore, experienceScore, preferenceScore };
  }
}
