// src/presentation/nest-modules/usuario.module.ts

import { Module } from '@nestjs/common';
import { UsuarioController } from '../controllers/usuario.controller';
import { RegistrarUsuarioUseCase } from '../../domain/use-cases/registrar-usuario.use-case';
import { AutenticarUsuarioUseCase } from '../../domain/use-cases/autenticar-usuario.use-case';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { CryptographyService } from '../../domain/services/cryptography.service';
import { TokenService } from '../../domain/services/token.service';

@Module({
  controllers: [UsuarioController],
  providers: [
    {
      provide: RegistrarUsuarioUseCase,
      useFactory: (repo: UsuarioRepository, crypto: CryptographyService) =>
        new RegistrarUsuarioUseCase(repo, crypto),
      inject: [UsuarioRepository, CryptographyService],
    },
    {
      provide: AutenticarUsuarioUseCase,
      useFactory: (
        repo: UsuarioRepository,
        crypto: CryptographyService,
        token: TokenService,
      ) => new AutenticarUsuarioUseCase(repo, crypto, token),
      inject: [UsuarioRepository, CryptographyService, TokenService],
    },
  ],
})
export class UsuarioModule {}
