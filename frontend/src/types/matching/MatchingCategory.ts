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
  analiseQualitativa: string;
  nivelRelevancia: string;
}

/**
 * Interface for experience matching category
 */
export interface ExperienceMatchingCategory
  extends Omit<
    MatchingCategory,
    "correspondentes" | "faltantes" | "excedentes"
  > {
  tempoAtende: boolean;
  areasCorrespondentes: string[];
  areasFaltantes: string[];
  relevanciaExperiencia: string;
}

/**
 * Interface for education matching category
 */
export interface EducationMatchingCategory
  extends Omit<
    MatchingCategory,
    "correspondentes" | "faltantes" | "excedentes"
  > {
  nivelAtende: boolean;
  areaAtende: boolean;
  formacaoAlternativaRelevante: boolean;
}

/**
 * Interface for location matching category
 */
export interface LocationMatchingCategory
  extends Omit<
    MatchingCategory,
    "correspondentes" | "faltantes" | "excedentes"
  > {
  localizacaoCompativel: boolean;
  disponibilidadeCompativel: boolean;
}
