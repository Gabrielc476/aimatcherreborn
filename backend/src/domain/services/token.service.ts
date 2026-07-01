// src/domain/services/token.service.ts

export interface TokenPayload {
  userId: string;
  email: string;
}

export abstract class TokenService {
  abstract gerarToken(payload: TokenPayload, tempoExpiracaoHoras?: number): string;
  abstract validarToken(token: string): TokenPayload | null;
}
