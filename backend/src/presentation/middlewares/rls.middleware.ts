// src/presentation/middlewares/rls.middleware.ts

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { TokenService } from '../../domain/services/token.service';

@Injectable()
export class RlsMiddleware implements NestMiddleware {
  constructor(private readonly tokenService: TokenService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    let userId = '';
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token as string;
    }

    if (token) {
      const payload = this.tokenService.validarToken(token);
      if (payload) {
        userId = payload.userId;
        (req as any).user = payload; // Anexa o usuário ao request para uso nos controllers/guards
      }
    }

    // Executa a requisição dentro do escopo do AsyncLocalStorage para RLS
    PrismaService.als.run({ userId }, () => {
      next();
    });
  }
}
