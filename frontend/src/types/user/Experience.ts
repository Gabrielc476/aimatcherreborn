// types/Experience.ts
/**
 * Interface representing work experience
 */
export interface Experience {
  id?: string;
  empresa: string;
  cargo: string;
  descricao: string;
  dataInicio: string;
  dataFim?: string;
  atual: boolean;
  tecnologias: string[];
}
