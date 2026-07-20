// src/main.ts

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './presentation/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Registra interceptador global de logging e RAM
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Habilita CORS flexível para Vercel, domínios customizados e localhost
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const configuredUrl = process.env.FRONTEND_URL;
      const allowedOrigins = [
        configuredUrl,
        'http://localhost:3000',
        'http://localhost:3001',
      ].filter(Boolean);

      // Permite requisições sem cabeçalho Origin (curl, mobile apps, servidor a servidor)
      if (!origin) {
        return callback(null, true);
      }

      // Permite se corresponder às URLs configuradas ou se for qualquer subdomínio .vercel.app
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Habilita validação global de DTOs via class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades que não estão no DTO
      forbidNonWhitelisted: true, // Retorna erro se propriedades não permitidas forem enviadas
      transform: true, // Converte os tipos dos payloads automaticamente
    }),
  );

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`Serviço AI Matcher rodando na porta: ${port}`);
}
bootstrap();
