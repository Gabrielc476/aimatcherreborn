// src/presentation/guards/jwt-auth.guard.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // O usuário é decodificado e anexado no RlsMiddleware
    if (!request.user) {
      throw new UnauthorizedException(
        'Acesso não autorizado. Token inválido, expirado ou não fornecido.',
      );
    }

    return true;
  }
}
