// types/TechnicalSkill.ts
/**
 * Interface representing technical skills
 */
export interface TechnicalSkill {
  id?: string;
  nome: string;
  nivel: "Básico" | "Intermediário" | "Avançado" | "Especialista";
  anosExperiencia: number;
}
