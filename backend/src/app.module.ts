// src/app.module.ts

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from './presentation/nest-modules/database.module';
import { SecurityModule } from './presentation/nest-modules/security.module';
import { AIModule } from './presentation/nest-modules/ai.module';
import { StorageModule } from './presentation/nest-modules/storage.module';
import { PDFModule } from './presentation/nest-modules/pdf.module';
import { UsuarioModule } from './presentation/nest-modules/usuario.module';
import { CurriculoModule } from './presentation/nest-modules/curriculo.module';
import { VagaModule } from './presentation/nest-modules/vaga.module';
import { MatchingModule } from './presentation/nest-modules/matching.module';
import { ScraperModule } from './presentation/nest-modules/scraper.module';
import { JobModule } from './presentation/nest-modules/job.module';
import { RlsMiddleware } from './presentation/middlewares/rls.middleware';

@Module({
  imports: [
    // Habilita agendamentos crons
    ScheduleModule.forRoot(),
    // Configura o BullMQ com Redis
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
        },
      }),
    }),
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
    ScraperModule,
    JobModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplica o RlsMiddleware em todos os endpoints para capturar o JWT
    // e iniciar o AsyncLocalStorage para o RLS do Prisma/Postgres
    consumer.apply(RlsMiddleware).forRoutes('*');
  }
}
