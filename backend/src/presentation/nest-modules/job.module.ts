// src/presentation/nest-modules/job.module.ts
import { Module, Global } from '@nestjs/common';
import { JobController } from '../controllers/job.controller';
import { JobEventsService } from '../../domain/services/job-events.service';
import { JobProcessamentoRepository } from '../../domain/repositories/job-processamento.repository';
import { PrismaJobProcessamentoRepository } from '../../infrastructure/database/repositories/prisma-job-processamento.repository';
import { DatabaseModule } from './database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [JobController],
  providers: [
    JobEventsService,
    {
      provide: JobProcessamentoRepository,
      useClass: PrismaJobProcessamentoRepository,
    },
  ],
  exports: [JobEventsService, JobProcessamentoRepository],
})
export class JobModule {}
