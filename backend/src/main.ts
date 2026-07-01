// src/main.ts

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita CORS
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Habilita validação global de DTOs via class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // Remove propriedades que não estão no DTO
      forbidNonWhitelisted: true, // Retorna erro se propriedades não permitidas forem enviadas
      transform: true,       // Converte os tipos dos payloads automaticamente
    }),
  );

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`Serviço AI Matcher rodando na porta: ${port}`);
}
bootstrap();
