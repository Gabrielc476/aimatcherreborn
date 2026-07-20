import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as tmp from 'tmp';

@Processor('pdf-generation', {
  concurrency: 1, // Restringe a geração paralela de PDFs para evitar picos de memória/CPU
})
export class PdfGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfGenerationProcessor.name);

  async process(job: Job<any, any, string>): Promise<string> {
    const resumeData = job.data;
    const scriptPath = path.resolve(
      __dirname,
      '../../../../scraper/pdf_generator.py',
    );
    const scraperDir = path.resolve(__dirname, '../../../../scraper');

    // Create temporary files
    const tempJson = tmp.fileSync({ postfix: '.json' });
    const tempPdf = tmp.fileSync({ postfix: '.pdf' });

    fs.writeFileSync(
      tempJson.name,
      JSON.stringify(resumeData, null, 2),
      'utf-8',
    );

    this.logger.log(
      `[BullMQ Worker] Starting PDF generation for job ${job.id}. JSON: ${tempJson.name}, Output PDF: ${tempPdf.name}`,
    );

    return new Promise<string>((resolve, reject) => {
      // In Windows, spawn using shell: true to resolve python in path
      const child = spawn('python', [scriptPath, tempJson.name, tempPdf.name], {
        cwd: scraperDir,
        shell: true,
      });

      let stderrOutput = '';

      child.stderr.on('data', (data) => {
        stderrOutput += data.toString();
        this.logger.error(`[Python PDF Gen Stderr] ${data.toString()}`);
      });

      child.on('close', (code) => {
        this.logger.log(`[BullMQ Worker] Python PDF process exited with code ${code}`);

        if (code === 0) {
          try {
            const pdfBuffer = fs.readFileSync(tempPdf.name);
            const base64Pdf = pdfBuffer.toString('base64');

            // Clean up temp files
            try {
              tempJson.removeCallback();
              tempPdf.removeCallback();
            } catch (cleanupErr) {
              this.logger.warn(`Failed to clean up temp files: ${cleanupErr}`);
            }

            resolve(base64Pdf);
          } catch (err) {
            reject(err);
          }
        } else {
          // Clean up temp files on error
          try {
            tempJson.removeCallback();
            tempPdf.removeCallback();
          } catch (cleanupErr) {}
          
          reject(
            new Error(
              `Python PDF process exited with code ${code}. Error: ${stderrOutput}`,
            ),
          );
        }
      });

      child.on('error', (err) => {
        // Clean up temp files on error
        try {
          tempJson.removeCallback();
          tempPdf.removeCallback();
        } catch (cleanupErr) {}

        this.logger.error(`Failed to start Python process: ${err.message}`);
        reject(err);
      });
    });
  }
}
