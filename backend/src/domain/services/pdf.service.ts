// src/domain/services/pdf.service.ts

export abstract class PDFService {
  abstract extrairTexto(fileBuffer: Buffer): Promise<string>;
}
