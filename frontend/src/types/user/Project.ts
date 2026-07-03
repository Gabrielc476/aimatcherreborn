// types/Project.ts
/**
 * Interface representing a portfolio/personal project
 */
export interface Project {
  id?: string;
  nome: string;
  descricao?: string;
  tecnologias: string[];
  url?: string;
}
