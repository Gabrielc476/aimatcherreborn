import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PdfGenerationProcessor } from './pdf-generation.processor';
import { PythonPdfGeneratorService } from './pdf-generator.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'pdf-generation',
    }),
  ],
  providers: [PdfGenerationProcessor, PythonPdfGeneratorService],
  exports: [BullModule, PythonPdfGeneratorService],
})
export class PdfQueueModule {}
