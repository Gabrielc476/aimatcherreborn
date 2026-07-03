// types/Certification.ts
/**
 * Interface representing certifications
 */
export interface Certification {
  id?: string;
  nome: string;
  emissor: string;
  dataObtencao: string;
  dataValidade?: string;
  codigoValidade?: string;
}
