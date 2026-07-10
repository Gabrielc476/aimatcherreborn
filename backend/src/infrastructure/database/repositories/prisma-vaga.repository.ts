// src/infrastructure/database/repositories/prisma-vaga.repository.ts

import { Injectable } from '@nestjs/common';
import { VagaRepository } from '../../../domain/repositories/vaga.repository';
import { Vaga, RequisitosVaga } from '../../../domain/entities/vaga.entity';
import { ModalidadeTrabalho } from '../../../domain/entities/usuario.entity';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaVagaRepository implements VagaRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomain(dbVaga: any): Vaga | null {
    if (!dbVaga) return null;

    return new Vaga(
      dbVaga.id,
      dbVaga.recrutadorId,
      dbVaga.titulo,
      dbVaga.descricao,
      dbVaga.status,
      dbVaga.empresaNome,
      dbVaga.modalidade as ModalidadeTrabalho,
      dbVaga.tipoContrato,
      dbVaga.nivel,
      dbVaga.dataCriacao,
      dbVaga.resumo || undefined,
      dbVaga.localizacao || undefined,
      dbVaga.salarioMin ? Number(dbVaga.salarioMin) : undefined,
      dbVaga.salarioMax ? Number(dbVaga.salarioMax) : undefined,
      dbVaga.requisitos ? (dbVaga.requisitos as RequisitosVaga) : undefined,
      dbVaga.palavrasChave,
      dbVaga.link || undefined,
    );
  }

  async salvar(vaga: Vaga): Promise<Vaga> {
    // Salvamento de vaga. Roda sob o RLS do recrutador.
    return this.prisma.runWithRLS(async (tx) => {
      const dbVaga = await tx.vaga.upsert({
        where: { id: vaga.id },
        update: {
          titulo: vaga.titulo,
          descricao: vaga.descricao,
          resumo: vaga.resumo,
          status: vaga.status,
          empresaNome: vaga.empresaNome,
          localizacao: vaga.localizacao,
          modalidade: vaga.modalidade,
          tipoContrato: vaga.tipoContrato,
          nivel: vaga.nivel,
          salarioMin: vaga.salarioMin,
          salarioMax: vaga.salarioMax,
          requisitos: (vaga.requisitos as any) || undefined,
          palavrasChave: vaga.palavrasChave,
          link: vaga.link,
        },
        create: {
          id: vaga.id,
          recrutadorId: vaga.recrutadorId,
          titulo: vaga.titulo,
          descricao: vaga.descricao,
          resumo: vaga.resumo,
          status: vaga.status,
          empresaNome: vaga.empresaNome,
          localizacao: vaga.localizacao,
          modalidade: vaga.modalidade,
          tipoContrato: vaga.tipoContrato,
          nivel: vaga.nivel,
          salarioMin: vaga.salarioMin,
          salarioMax: vaga.salarioMax,
          requisitos: (vaga.requisitos as any) || undefined,
          palavrasChave: vaga.palavrasChave,
          link: vaga.link,
          dataCriacao: vaga.dataCriacao,
        },
      });

      return this.mapToDomain(dbVaga)!;
    });
  }

  async buscarPorId(id: string): Promise<Vaga | null> {
    // Buscar vaga específica. Vagas podem ser públicas, mas vamos rodar no contexto RLS
    // de quem está buscando ou bypassando se for necessário. Roda com RLS.
    return this.prisma.runWithRLS(async (tx) => {
      const dbVaga = await tx.vaga.findUnique({
        where: { id },
      });
      return this.mapToDomain(dbVaga);
    });
  }

  async listarAtivas(limite: number, pagina: number): Promise<{ total: number; vagas: Vaga[] }> {
    return this.prisma.runWithRLS(async (tx) => {
      const skip = (pagina - 1) * limite;

      const [total, dbVagas] = await Promise.all([
        tx.vaga.count({ where: { status: 'ativa' } }),
        tx.vaga.findMany({
          where: { status: 'ativa' },
          skip,
          take: limite,
          orderBy: { dataCriacao: 'desc' },
        }),
      ]);

      return {
        total,
        vagas: dbVagas.map((v) => this.mapToDomain(v)!),
      };
    });
  }

  async buscarPorPalavrasChave(palavrasChave: string[], limite: number, pagina: number): Promise<Vaga[]> {
    return this.prisma.runWithRLS(async (tx) => {
      const skip = (pagina - 1) * limite;

      const dbVagas = await tx.vaga.findMany({
        where: {
          status: 'ativa',
          palavrasChave: {
            hasSome: palavrasChave,
          },
        },
        skip,
        take: limite,
        orderBy: { dataCriacao: 'desc' },
      });

      return dbVagas.map((v) => this.mapToDomain(v)!);
    });
  }

  async buscarPorRecrutador(recrutadorId: string, limite: number, pagina: number): Promise<{ total: number; vagas: Vaga[] }> {
    return this.prisma.runWithRLS(async (tx) => {
      const skip = (pagina - 1) * limite;

      const [total, dbVagas] = await Promise.all([
        tx.vaga.count({ where: { recrutadorId } }),
        tx.vaga.findMany({
          where: { recrutadorId },
          skip,
          take: limite,
          orderBy: { dataCriacao: 'desc' },
        }),
      ]);

      return {
        total,
        vagas: dbVagas.map((v) => this.mapToDomain(v)!),
      };
    });
  }

  async atualizar(id: string, vaga: Partial<Vaga>): Promise<Vaga> {
    return this.prisma.runWithRLS(async (tx) => {
      const dbVaga = await tx.vaga.update({
        where: { id },
        data: {
          titulo: vaga.titulo,
          descricao: vaga.descricao,
          resumo: vaga.resumo,
          status: vaga.status,
          empresaNome: vaga.empresaNome,
          localizacao: vaga.localizacao,
          modalidade: vaga.modalidade,
          tipoContrato: vaga.tipoContrato,
          nivel: vaga.nivel,
          salarioMin: vaga.salarioMin,
          salarioMax: vaga.salarioMax,
          requisitos: (vaga.requisitos as any) || undefined,
          palavrasChave: vaga.palavrasChave,
          link: vaga.link,
        },
      });
      return this.mapToDomain(dbVaga)!;
    });
  }

  async excluir(id: string): Promise<boolean> {
    return this.prisma.runWithRLS(async (tx) => {
      const result = await tx.vaga.delete({
        where: { id },
      });
      return !!result;
    });
  }
}
