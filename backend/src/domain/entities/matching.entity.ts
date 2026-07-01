// src/domain/entities/matching.entity.ts

export interface CategoriaMatching {
  score: number;
  peso: number;
  correspondentes: string[];
  faltantes: string[];
  excedentes?: string[];
  analiseQualitativa: string;
  nivelRelevancia: string;
}

export interface DetalhesMatching {
  categorias: {
    habilidadesTecnicas: CategoriaMatching;
    experiencia: CategoriaMatching & { tempoAtende: boolean; areasCorrespondentes: string[]; areasFaltantes: string[] };
    formacao: CategoriaMatching & { nivelAtende: boolean; areaAtende: boolean; formacaoAlternativaRelevante: boolean };
    idiomas: CategoriaMatching;
    localizacaoDisponibilidade: CategoriaMatching & { localizacaoCompativel: boolean; disponibilidadeCompativel: boolean };
    softSkillsCultura: CategoriaMatching;
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

export class Matching {
  constructor(
    public readonly id: string,
    public usuarioId: string,
    public vagaId: string,
    public score: number,
    public analise: DetalhesMatching,
    public dataMatching: Date,
  ) {}
}
