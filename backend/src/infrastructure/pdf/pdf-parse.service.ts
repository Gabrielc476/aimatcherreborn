// src/infrastructure/pdf/pdf-parse.service.ts

import { Injectable } from '@nestjs/common';
import { PDFService } from '../../domain/services/pdf.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdf = require('pdf-parse');

@Injectable()
export class PdfParseService implements PDFService {
  async extrairTexto(fileBuffer: Buffer): Promise<string> {
    try {
      const data = await pdf(fileBuffer);
      return data.text;
    } catch (error) {
      throw new Error(`Erro ao extrair texto do PDF: ${(error as Error).message}`);
    }
  }
}
