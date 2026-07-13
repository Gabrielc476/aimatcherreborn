// src/presentation/nest-modules/database.module.ts

import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { PrismaUsuarioRepository } from '../../infrastructure/database/repositories/prisma-usuario.repository';
import { VagaRepository } from '../../domain/repositories/vaga.repository';
import { PrismaVagaRepository } from '../../infrastructure/database/repositories/prisma-vaga.repository';
import { MatchingRepository } from '../../domain/repositories/matching.repository';
import { PrismaMatchingRepository } from '../../infrastructure/database/repositories/prisma-matching.repository';
import { InMemoryCacheService } from '../../infrastructure/cache/in-memory-cache.service';

@Global()
@Module({
  providers: [
    PrismaService,
    InMemoryCacheService,
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
    InMemoryCacheService,
    UsuarioRepository,
    VagaRepository,
    MatchingRepository,
  ],
})
export class DatabaseModule {}
