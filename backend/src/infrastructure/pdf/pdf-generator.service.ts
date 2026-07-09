import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as tmp from 'tmp';

@Injectable()
export class PythonPdfGeneratorService {
  private readonly logger = new Logger(PythonPdfGeneratorService.name);

  async renderToPdf(resumeData: any): Promise<Buffer> {
    const scriptPath = path.resolve(__dirname, '../../../../scraper/pdf_generator.py');
    const scraperDir = path.resolve(__dirname, '../../../../scraper');
    
    // Create temporary files
    const tempJson = tmp.fileSync({ postfix: '.json' });
    const tempPdf = tmp.fileSync({ postfix: '.pdf' });
    
    fs.writeFileSync(tempJson.name, JSON.stringify(resumeData, null, 2), 'utf-8');
    
    this.logger.log(`Starting PDF generation. JSON: ${tempJson.name}, Output PDF: ${tempPdf.name}`);
    
    return new Promise((resolve, reject) => {
      // In Windows, we spawn using shell: true to resolve python executable in system PATH
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
        this.logger.log(`Python PDF process exited with code ${code}`);
        
        if (code === 0) {
          try {
            const pdfBuffer = fs.readFileSync(tempPdf.name);
            
            // Clean up temp files
            try {
              tempJson.removeCallback();
              tempPdf.removeCallback();
            } catch (cleanupErr) {
              this.logger.warn(`Failed to clean up temp files: ${cleanupErr}`);
            }
            
            resolve(pdfBuffer);
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error(`Python PDF process exited with code ${code}. Error: ${stderrOutput}`));
        }
      });

      child.on('error', (err) => {
        this.logger.error(`Failed to start Python process: ${err.message}`);
        reject(err);
      });
    });
  }
}
