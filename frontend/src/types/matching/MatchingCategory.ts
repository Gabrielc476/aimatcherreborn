// types/matching/MatchingCategory.ts
/**
 * Interface representing a generic matching category
 */
export interface MatchingCategory {
  score: number;
  peso: number;
  correspondentes: string[];
  faltantes: string[];
  excedentes?: string[];
  analise_qualitativa: string;
  nivel_relevancia: string;
}

/**
 * Interface for experience matching category
 */
export interface ExperienceMatchingCategory
  extends Omit<
    MatchingCategory,
    "correspondentes" | "faltantes" | "excedentes"
  > {
  tempo_atende: boolean;
  areas_correspondentes: string[];
  areas_faltantes: string[];
  relevancia_experiencia: string;
}

/**
 * Interface for education matching category
 */
export interface EducationMatchingCategory
  extends Omit<
    MatchingCategory,
    "correspondentes" | "faltantes" | "excedentes"
  > {
  nivel_atende: boolean;
  area_atende: boolean;
  formacao_alternativa_relevante: boolean;
}

/**
 * Interface for location matching category
 */
export interface LocationMatchingCategory
  extends Omit<
    MatchingCategory,
    "correspondentes" | "faltantes" | "excedentes"
  > {
  localizacao_compativel: boolean;
  disponibilidade_compativel: boolean;
}
