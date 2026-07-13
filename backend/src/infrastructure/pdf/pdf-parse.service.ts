// src/infrastructure/pdf/pdf-parse.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PDFService } from '../../domain/services/pdf.service';
import { PDF } from '@libpdf/core';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class LibPdfService implements PDFService {
  private readonly logger = new Logger(LibPdfService.name);

  async extrairTexto(fileBuffer: Buffer): Promise<string> {
    try {
      this.logger.log(`Iniciando extração de PDF com @libpdf/core. Tamanho do buffer: ${fileBuffer.length} bytes`);
      
      const bytes = new Uint8Array(fileBuffer);
      const pdf = await PDF.load(bytes);

      let fullText = '';
      const pages = pdf.getPages();

      // Itera pelas páginas extraindo os blocos de texto estruturados
      for (const page of pages) {
        const pageText = page.extractText();
        if (pageText && pageText.text) {
          fullText += pageText.text + '\n';
        }
      }

      let textoFinal = fullText.trim();
      this.logger.log(`Extração com @libpdf/core concluída. Comprimento do texto: ${textoFinal.length}`);

      // Se o texto for vazio ou irrisório (menos de 50 caracteres para um currículo completo),
      // significa que o PDF provavelmente é escaneado ou possui texto convertido em curvas vetoriais.
      if (textoFinal.length < 50) {
        this.logger.log('Texto extraído insuficiente ou vazio. Iniciando fallback com OCR via Gemini...');
        
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error('Texto extraído do PDF está vazio e GEMINI_API_KEY não foi configurada para o fallback do OCR.');
        }

        const ai = new GoogleGenAI({ apiKey });
        const modelName = 'gemma-4-12b-it';

        let response;
        const ocrPayload = {
          contents: [
            {
              inlineData: {
                data: fileBuffer.toString('base64'),
                mimeType: 'application/pdf'
              }
            },
            'Você é um extrator de texto de PDF por OCR de alta precisão. Extraia todo o texto deste currículo em PDF de forma literal, mantendo exatamente a ordem de leitura e a formatação do documento.'
          ]
        };

        try {
          response = await ai.models.generateContent({
            model: modelName,
            ...ocrPayload
          });
        } catch (primaryError: any) {
          const fallbackModel = 'gemini-3.1-flash-lite';
          this.logger.warn(`Erro no OCR com modelo principal '${modelName}'. Tentando fallback com '${fallbackModel}'... Erro: ${primaryError.message || primaryError}`);
          response = await ai.models.generateContent({
            model: fallbackModel,
            ...ocrPayload
          });
        }

        const ocrText = response.text || '';
        textoFinal = ocrText.trim();
        this.logger.log(`OCR com Gemini concluído com sucesso. Comprimento do texto extraído: ${textoFinal.length}`);
      }
      
      if (!textoFinal) {
        throw new Error('Nenhum caractere pôde ser extraído deste PDF via leitor estruturado ou OCR.');
      }

      return textoFinal;
    } catch (error) {
      this.logger.error(`Erro ao extrair texto com LibPDF/Gemini OCR: ${(error as Error).message}`);
      throw new Error(`Erro ao extrair texto do PDF: ${(error as Error).message}`);
    }
  }
}