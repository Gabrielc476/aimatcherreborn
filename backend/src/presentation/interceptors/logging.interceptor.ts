import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const { method, url, ip } = request;
    
    // Ignora requisições de healthcheck para evitar poluição de logs
    const userAgent = request.headers['user-agent']?.toLowerCase() || '';
    if (
      url.startsWith('/vaga/listar') &&
      (userAgent.includes('wget') || ip === '::1' || ip === '127.0.0.1')
    ) {
      return next.handle();
    }
    const startTime = Date.now();

    // Medição de memória inicial
    const memBefore = process.memoryUsage();
    const heapBeforeMB = Math.round(memBefore.heapUsed / 1024 / 1024);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const response = httpContext.getResponse();
          const statusCode = response.statusCode;

          // Medição de memória pós-execução
          const memAfter = process.memoryUsage();
          const heapAfterMB = Math.round(memAfter.heapUsed / 1024 / 1024);
          const rssMB = Math.round(memAfter.rss / 1024 / 1024);
          const diffMB = heapAfterMB - heapBeforeMB;
          const diffSign = diffMB >= 0 ? `+${diffMB}` : `${diffMB}`;

          const logMsg = `${method} ${url} ${statusCode} - ${duration}ms | Heap: ${heapAfterMB}MB (${diffSign}MB) | RSS: ${rssMB}MB | IP: ${ip}`;
          
          if (duration > 5000) {
            this.logger.warn(`[SLOW ENDPOINT] ${logMsg}`);
          } else {
            this.logger.log(logMsg);
          }

          // Alerta se a memória estiver perigosamente alta (acima de 400MB de RSS ou 380MB de Heap)
          if (rssMB > 400 || heapAfterMB > 380) {
            this.logger.error(
              `[CRITICAL MEMORY WARNING] O container NestJS está usando ${rssMB}MB de RAM (RSS) e ${heapAfterMB}MB de Heap. Limite físico é de 512MB.`
            );
          }
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          const memAfter = process.memoryUsage();
          const heapAfterMB = Math.round(memAfter.heapUsed / 1024 / 1024);
          const rssMB = Math.round(memAfter.rss / 1024 / 1024);

          this.logger.error(
            `[ENDPOINT ERROR] ${method} ${url} - Falha após ${duration}ms | Erro: ${err.message || err} | Heap: ${heapAfterMB}MB | RSS: ${rssMB}MB`
          );
        }
      })
    );
  }
}
