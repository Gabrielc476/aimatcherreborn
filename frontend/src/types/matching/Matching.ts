import {
  MatchingCategory,
  ExperienceMatchingCategory,
  EducationMatchingCategory,
  LocationMatchingCategory,
} from "./MatchingCategory";

/**
 * Interface representing a detailed matching analysis
 */
export interface DetalhesMatching {
  categorias: {
    habilidadesTecnicas: MatchingCategory;
    experiencia: ExperienceMatchingCategory;
    formacao: EducationMatchingCategory;
    idiomas: MatchingCategory;
    localizacaoDisponibilidade: LocationMatchingCategory;
    softSkillsCultura: MatchingCategory;
  };
  resumoCandidato: string;
  resumoVaga: string;
  diferenciais: {
    pontosFortes: string[];
    pontosFracos: string[];
    vantagensCompetitivas: string[];
  };
  recomendacoes: {
    gerais: string;
    habilidadesTecnicas: string;
    experiencia: string;
    formacao: string;
    desenvolvimento: string;
    abordagemEntrevista: string;
    prioridadeAcao: string[];
  };
  compatibilidadeCultural: {
    score: number;
    fatoresPositivos: string[];
    fatoresNegativos: string[];
    analise: string;
  };
  probabilidadeSucesso: {
    score: number;
    justificativa: string;
    fatoresCriticos: string[];
  };
  metaAnalise: {
    confiabilidade: number;
    fatoresIncertos: string[];
    potencialDesenvolvimento: number;
    observacoes?: string;
  };
}

/**
 * Interface representing matching data between a user and a job
 * Based on the Matching model from the backend
 */
export interface Matching {
  id: string;
  usuarioId: string;
  vagaId: string;
  score: number;
  analise: DetalhesMatching;
  dataMatching: string;
}
