// types/TechnicalSkill.ts
/**
 * Interface representing technical skills
 */
export interface TechnicalSkill {
  nome: string;
  nivel: "Básico" | "Intermediário" | "Avançado" | "Especialista";
  anos_experiencia: number;
  projetos_relevantes: string[];
}
