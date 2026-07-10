// types/auth/RegisterRequest.ts
/**
 * Interface for registration request
 */
export interface RegisterRequest {
  nomeCompleto: string;
  email: string;
  senha: string;
  telefone?: string;
  dataNascimento?: string;
  role?: 'CANDIDATO' | 'RECRUTADOR';
}
