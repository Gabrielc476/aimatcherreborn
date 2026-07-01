// src/infrastructure/database/prisma.service.ts

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

export interface UserSession {
  userId: string;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // AsyncLocalStorage para armazenar o ID do usuário ativo na thread da requisição HTTP
  public static readonly als = new AsyncLocalStorage<UserSession>();

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Executa uma série de operações dentro de uma transação PostgreSQL,
   * definindo a variável de sessão 'app.current_user_id' antes de executar
   * qualquer query. Isso garante a aplicação correta do RLS (Row Level Security).
   */
  async runWithRLS<T>(operations: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>): Promise<T> {
    const session = PrismaService.als.getStore();
    const userId = session?.userId;

    // Se não houver usuário autenticado no contexto da requisição (ex: rota pública),
    // executa sem definir a variável de sessão (ou com valor vazio)
    return this.$transaction(async (tx) => {
      if (userId) {
        // Define a variável de sessão 'request.jwt.claims' na transação atual para que a função auth.uid() do Supabase funcione
        await tx.$executeRawUnsafe(`SELECT set_config('request.jwt.claims', '{"sub": "${userId}", "role": "authenticated"}', true);`);
      } else {
        await tx.$executeRawUnsafe(`SELECT set_config('request.jwt.claims', '{}', true);`);
      }
      return operations(tx);
    });
  }
}
