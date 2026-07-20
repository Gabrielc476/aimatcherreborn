import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, QueueEvents } from 'bullmq';

@Injectable()
export class PythonPdfGeneratorService {
  private readonly logger = new Logger(PythonPdfGeneratorService.name);
  private queueEvents: QueueEvents;

  constructor(
    @InjectQueue('pdf-generation') private readonly pdfQueue: Queue,
  ) {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDIS_PORT) || 6379;
    this.queueEvents = new QueueEvents('pdf-generation', {
      connection: { host, port },
    });
  }

  async renderToPdf(resumeData: any): Promise<Buffer> {
    this.logger.log(`Enqueuing PDF generation job in BullMQ...`);
    const job = await this.pdfQueue.add('generate', resumeData);
    
    this.logger.log(`Awaiting completion of job ${job.id}...`);
    const base64Pdf = await job.waitUntilFinished(this.queueEvents);

    this.logger.log(`Job ${job.id} completed. Converting result to PDF buffer.`);
    return Buffer.from(base64Pdf, 'base64');
  }
}
