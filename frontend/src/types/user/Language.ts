// types/Language.ts
/**
 * Interface representing language proficiency
 */
export interface Language {
  id?: string;
  nome: string;
  nivelLeitura: "Básico" | "Intermediário" | "Avançado" | "Fluente";
  nivelEscrita: "Básico" | "Intermediário" | "Avançado" | "Fluente";
  nivelConversacao: "Básico" | "Intermediário" | "Avançado" | "Fluente";
}
