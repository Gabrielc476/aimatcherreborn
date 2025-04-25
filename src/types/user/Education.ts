// types/Education.ts
/**
 * Interface representing education
 */
export interface Education {
  instituicao: string;
  curso: string;
  grau: string;
  area: string;
  data_inicio: string;
  data_fim?: string;
  concluido: boolean;
}
