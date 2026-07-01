// src/presentation/nest-modules/database.module.ts

import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { PrismaUsuarioRepository } from '../../infrastructure/database/repositories/prisma-usuario.repository';
import { VagaRepository } from '../../domain/repositories/vaga.repository';
import { PrismaVagaRepository } from '../../infrastructure/database/repositories/prisma-vaga.repository';
import { MatchingRepository } from '../../domain/repositories/matching.repository';
import { PrismaMatchingRepository } from '../../infrastructure/database/repositories/prisma-matching.repository';

@Global() // Torna o DatabaseModule global para que o PrismaService e Repositórios fiquem disponíveis em toda a aplicação
@Module({
  providers: [
    PrismaService,
    {
      provide: UsuarioRepository,
      useClass: PrismaUsuarioRepository,
    },
    {
      provide: VagaRepository,
      useClass: PrismaVagaRepository,
    },
    {
      provide: MatchingRepository,
      useClass: PrismaMatchingRepository,
    },
  ],
  exports: [
    PrismaService,
    UsuarioRepository,
    VagaRepository,
    MatchingRepository,
  ],
})
export class DatabaseModule {}
