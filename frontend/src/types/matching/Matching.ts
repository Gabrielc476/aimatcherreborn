// types/matching/Matching.ts
import { ObjectId } from "mongodb";
import {
  MatchingCategory,
  ExperienceMatchingCategory,
  EducationMatchingCategory,
  LocationMatchingCategory,
} from "./MatchingCategory";

/**
 * Interface representing matching data between a user and a job
 * Based on the MatchingModelo from the backend
 */
export interface Matching {
  _id?: ObjectId;
  usuario_id: string;
  vaga_id: string;
  data_matching: string;
  criado_em?: string;
  atualizado_em?: string;

  // Resumos para contextualização rápida
  resumo_candidato: string;
  resumo_vaga: string;

  // Score geral de matching
  score_matching: number;

  // Análise detalhada por categorias
  categorias: {
    habilidades_tecnicas: MatchingCategory;
    experiencia: ExperienceMatchingCategory;
    formacao: EducationMatchingCategory;
    idiomas: MatchingCategory;
    localizacao_disponibilidade: LocationMatchingCategory;
    soft_skills_cultura: MatchingCategory;
  };

  // Análise dos fatores de diferenciação
  diferenciais: {
    pontos_fortes: string[];
    pontos_fracos: string[];
    vantagens_competitivas: string[];
  };

  // Recomendações personalizadas
  recomendacoes: {
    gerais: string;
    habilidades_tecnicas: string;
    experiencia: string;
    formacao: string;
    desenvolvimento: string;
    abordagem_entrevista: string;
    prioridade_acao: string[];
  };

  // Análise de compatibilidade cultural e organizacional
  compatibilidade_cultural: {
    score: number;
    fatores_positivos: string[];
    fatores_negativos: string[];
    analise: string;
  };

  // Probabilidade de sucesso na candidatura
  probabilidade_sucesso: {
    score: number;
    justificativa: string;
    fatores_criticos: string[];
  };

  // Meta-análise do matching
  meta_analise: {
    confiabilidade: number;
    fatores_incertos: string[];
    potencial_desenvolvimento: number;
    observacoes: string;
  };
}
