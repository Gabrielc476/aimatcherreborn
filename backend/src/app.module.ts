// src/app.module.ts

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './presentation/nest-modules/database.module';
import { SecurityModule } from './presentation/nest-modules/security.module';
import { AIModule } from './presentation/nest-modules/ai.module';
import { StorageModule } from './presentation/nest-modules/storage.module';
import { PDFModule } from './presentation/nest-modules/pdf.module';
import { UsuarioModule } from './presentation/nest-modules/usuario.module';
import { CurriculoModule } from './presentation/nest-modules/curriculo.module';
import { VagaModule } from './presentation/nest-modules/vaga.module';
import { MatchingModule } from './presentation/nest-modules/matching.module';
import { RlsMiddleware } from './presentation/middlewares/rls.middleware';

@Module({
  imports: [
    // Carrega variáveis de ambiente globalmente
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    SecurityModule,
    AIModule,
    StorageModule,
    PDFModule,
    UsuarioModule,
    CurriculoModule,
    VagaModule,
    MatchingModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplica o RlsMiddleware em todos os endpoints para capturar o JWT
    // e iniciar o AsyncLocalStorage para o RLS do Prisma/Postgres
    consumer
      .apply(RlsMiddleware)
      .forRoutes('*');
  }
}
