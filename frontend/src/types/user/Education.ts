// types/Education.ts
/**
 * Interface representing education
 */
export interface Education {
  id?: string;
  instituicao: string;
  curso: string;
  grau: string;
  area: string;
  dataInicio: string;
  dataFim?: string;
  concluido: boolean;
}
