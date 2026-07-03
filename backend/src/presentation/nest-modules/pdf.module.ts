// src/presentation/nest-modules/pdf.module.ts

import { Global, Module } from '@nestjs/common';
import { PDFService } from '../../domain/services/pdf.service';
import { LibPdfService } from '../../infrastructure/pdf/pdf-parse.service';

@Global()
@Module({
  providers: [
    {
      provide: PDFService,
      useClass: LibPdfService,
    },
  ],
  exports: [PDFService],
})
export class PDFModule { }
