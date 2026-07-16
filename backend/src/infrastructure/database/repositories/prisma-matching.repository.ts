// src/infrastructure/database/repositories/prisma-matching.repository.ts

import { Injectable } from '@nestjs/common';
import { MatchingRepository } from '../../../domain/repositories/matching.repository';
import {
  Matching,
  DetalhesMatching,
} from '../../../domain/entities/matching.entity';
import { PrismaService } from '../prisma.service';
import { InMemoryCacheService } from '../../cache/in-memory-cache.service';

@Injectable()
export class PrismaMatchingRepository implements MatchingRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: InMemoryCacheService,
  ) {}

  private mapToDomain(dbMatching: any): Matching | null {
    if (!dbMatching) return null;

    return new Matching(
      dbMatching.id,
      dbMatching.usuarioId,
      dbMatching.vagaId,
      Number(dbMatching.score),
      dbMatching.analise as DetalhesMatching,
      dbMatching.dataMatching,
      dbMatching.status,
      dbMatching.usuario
        ? {
            nomeCompleto: dbMatching.usuario.nomeCompleto,
            email: dbMatching.usuario.email,
            telefone: dbMatching.usuario.telefone || undefined,
          }
        : undefined,
    );
  }

  async salvar(matching: Matching): Promise<Matching> {
    return this.prisma.runWithRLS(async (tx) => {
      const dbMatching = await tx.matching.upsert({
        where: {
          usuarioId_vagaId: {
            usuarioId: matching.usuarioId,
            vagaId: matching.vagaId,
          },
        },
        update: {
          score: matching.score,
          analise: (matching.analise as any) || undefined,
          status: matching.status,
        },
        create: {
          id: matching.id,
          usuarioId: matching.usuarioId,
          vagaId: matching.vagaId,
          score: matching.score,
          analise: (matching.analise as any) || undefined,
          dataMatching: matching.dataMatching,
          status: matching.status,
        },
      });

      this.cache.deleteByPrefix(
        `matching:lista:usuario:${matching.usuarioId}:`,
      );
      this.cache.delete(
        `matching:single:${matching.usuarioId}:${matching.vagaId}`,
      );

      return this.mapToDomain(dbMatching)!;
    });
  }

  async buscar(usuarioId: string, vagaId: string): Promise<Matching | null> {
    const cacheKey = `matching:single:${usuarioId}:${vagaId}`;
    const cached = this.cache.get<Matching | null>(cacheKey);
    if (cached !== null) return cached;

    return this.prisma.runWithRLS(async (tx) => {
      const dbMatching = await tx.matching.findUnique({
        where: {
          usuarioId_vagaId: {
            usuarioId,
            vagaId,
          },
        },
      });
      const result = this.mapToDomain(dbMatching);
      this.cache.set(cacheKey, result, 30); // 30 segundos
      return result;
    });
  }

  async buscarPorUsuario(
    usuarioId: string,
    limite: number,
    pagina: number,
  ): Promise<{ total: number; matchings: Matching[] }> {
    const cacheKey = `matching:lista:usuario:${usuarioId}:pag:${pagina}:lim:${limite}`;
    const cached = this.cache.get<{ total: number; matchings: Matching[] }>(
      cacheKey,
    );
    if (cached) return cached;

    return this.prisma.runWithRLS(async (tx) => {
      const skip = (pagina - 1) * limite;

      const [total, dbMatchings] = await Promise.all([
        tx.matching.count({ where: { usuarioId } }),
        tx.matching.findMany({
          where: { usuarioId },
          skip,
          take: limite,
          orderBy: { score: 'desc' },
        }),
      ]);

      const result = {
        total,
        matchings: dbMatchings.map((m) => this.mapToDomain(m)!),
      };
      this.cache.set(cacheKey, result, 30); // 30 segundos
      return result;
    });
  }

  async buscarPorVaga(
    vagaId: string,
    scoreMinimo: number,
    limite: number,
    pagina: number,
  ): Promise<{ total: number; matchings: Matching[] }> {
    return this.prisma.runWithRLS(async (tx) => {
      const skip = (pagina - 1) * limite;

      const [total, dbMatchings] = await Promise.all([
        tx.matching.count({
          where: {
            vagaId,
            score: { gte: scoreMinimo },
          },
        }),
        tx.matching.findMany({
          where: {
            vagaId,
            score: { gte: scoreMinimo },
          },
          include: {
            usuario: {
              select: {
                id: true,
                nomeCompleto: true,
                email: true,
                telefone: true,
              },
            },
          },
          skip,
          take: limite,
          orderBy: { score: 'desc' },
        }),
      ]);

      return {
        total,
        matchings: dbMatchings.map((m) => this.mapToDomain(m)!),
      };
    });
  }

  async excluir(usuarioId: string, vagaId: string): Promise<boolean> {
    return this.prisma.runWithRLS(async (tx) => {
      const result = await tx.matching.delete({
        where: {
          usuarioId_vagaId: {
            usuarioId,
            vagaId,
          },
        },
      });

      this.cache.deleteByPrefix(`matching:lista:usuario:${usuarioId}:`);
      this.cache.delete(`matching:single:${usuarioId}:${vagaId}`);

      return !!result;
    });
  }
}
