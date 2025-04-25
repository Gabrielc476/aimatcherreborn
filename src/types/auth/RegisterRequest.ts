// types/auth/RegisterRequest.ts
/**
 * Interface for registration request
 */
export interface RegisterRequest {
  nome_completo: string;
  email: string;
  senha: string;
  telefone?: string;
  data_nascimento?: string;
}
