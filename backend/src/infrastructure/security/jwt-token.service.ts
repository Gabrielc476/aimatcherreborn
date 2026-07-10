// src/infrastructure/security/jwt-token.service.ts

import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { TokenService, TokenPayload } from '../../domain/services/token.service';

@Injectable()
export class JwtTokenService implements TokenService {
  private readonly secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

  gerarToken(payload: TokenPayload, tempoExpiracaoHoras = 24): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: `${tempoExpiracaoHoras}h`,
    });
  }

  validarToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as any;
      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      return null;
    }
  }
}
