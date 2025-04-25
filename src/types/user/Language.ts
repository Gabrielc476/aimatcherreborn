// types/Language.ts
/**
 * Interface representing language proficiency
 */
export interface Language {
  nome: string;
  nivel_leitura: "Básico" | "Intermediário" | "Avançado" | "Fluente";
  nivel_escrita: "Básico" | "Intermediário" | "Avançado" | "Fluente";
  nivel_conversacao: "Básico" | "Intermediário" | "Avançado" | "Fluente";
}
