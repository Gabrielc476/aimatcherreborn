// src/presentation/nest-modules/ai.module.ts

import { Global, Module } from '@nestjs/common';
import { AIService } from '../../domain/services/ai.service';
import { GoogleGenAIService } from '../../infrastructure/ai/google-genai.service';

@Global()
@Module({
  providers: [
    {
      provide: AIService,
      useClass: GoogleGenAIService,
    },
  ],
  exports: [AIService],
})
export class AIModule {}
