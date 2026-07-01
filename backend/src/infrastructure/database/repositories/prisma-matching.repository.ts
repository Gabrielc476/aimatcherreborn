// src/infrastructure/database/repositories/prisma-matching.repository.ts

import { Injectable } from '@nestjs/common';
import { MatchingRepository } from '../../../domain/repositories/matching.repository';
import { Matching, DetalhesMatching } from '../../../domain/entities/matching.entity';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaMatchingRepository implements MatchingRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomain(dbMatching: any): Matching | null {
    if (!dbMatching) return null;

    return new Matching(
      dbMatching.id,
      dbMatching.usuarioId,
      dbMatching.vagaId,
      Number(dbMatching.score),
      dbMatching.analise as DetalhesMatching,
      dbMatching.dataMatching,
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
        },
        create: {
          id: matching.id,
          usuarioId: matching.usuarioId,
          vagaId: matching.vagaId,
          score: matching.score,
          analise: (matching.analise as any) || undefined,
          dataMatching: matching.dataMatching,
        },
      });

      return this.mapToDomain(dbMatching)!;
    });
  }

  async buscar(usuarioId: string, vagaId: string): Promise<Matching | null> {
    return this.prisma.runWithRLS(async (tx) => {
      const dbMatching = await tx.matching.findUnique({
        where: {
          usuarioId_vagaId: {
            usuarioId,
            vagaId,
          },
        },
      });
      return this.mapToDomain(dbMatching);
    });
  }

  async buscarPorUsuario(usuarioId: string, limite: number, pagina: number): Promise<{ total: number; matchings: Matching[] }> {
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

      return {
        total,
        matchings: dbMatchings.map((m) => this.mapToDomain(m)!),
      };
    });
  }

  async buscarPorVaga(vagaId: string, scoreMinimo: number, limite: number, pagina: number): Promise<{ total: number; matchings: Matching[] }> {
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
      return !!result;
    });
  }
}
