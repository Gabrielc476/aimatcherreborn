// types/Certification.ts
/**
 * Interface representing certifications
 */
export interface Certification {
  nome: string;
  emissor: string;
  data_obtencao: string;
  data_validade?: string;
  codigo_validacao?: string;
}
