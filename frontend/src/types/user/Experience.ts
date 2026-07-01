// types/Experience.ts
/**
 * Interface representing work experience
 */
export interface Experience {
  empresa: string;
  cargo: string;
  descricao: string;
  data_inicio: string;
  data_fim?: string;
  atual: boolean;
  tecnologias_utilizadas: string[];
  realizacoes: string[];
}
