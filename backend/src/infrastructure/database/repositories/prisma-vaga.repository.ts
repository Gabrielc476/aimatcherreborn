// src/infrastructure/database/repositories/prisma-vaga.repository.ts

import { Injectable, Logger } from '@nestjs/common';
import { VagaRepository } from '../../../domain/repositories/vaga.repository';
import { Vaga, RequisitosVaga } from '../../../domain/entities/vaga.entity';
import { ModalidadeTrabalho } from '../../../domain/entities/usuario.entity';
import { PrismaService } from '../prisma.service';
import { InMemoryCacheService } from '../../cache/in-memory-cache.service';

@Injectable()
export class PrismaVagaRepository implements VagaRepository {
  private readonly logger = new Logger(PrismaVagaRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: InMemoryCacheService,
  ) {}

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
      dbVaga.etapas || undefined,
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
          etapas: vaga.etapas || undefined,
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
          etapas: vaga.etapas || undefined,
          palavrasChave: vaga.palavrasChave,
          link: vaga.link,
          dataCriacao: vaga.dataCriacao,
        },
      });

      this.cache.deleteByPrefix('vagas:listar:');
      this.cache.delete(`vaga:detalhes:${vaga.id}`);

      return this.mapToDomain(dbVaga)!;
    });
  }

  async buscarPorId(id: string): Promise<Vaga | null> {
    const cacheKey = `vaga:detalhes:${id}`;
    const cached = this.cache.get<Vaga | null>(cacheKey);
    if (cached !== null) return cached;

    const dbVaga = await this.prisma.vaga.findUnique({
      where: { id },
    });
    const result = this.mapToDomain(dbVaga);
    this.cache.set(cacheKey, result, 300); // 5 minutos
    return result;
  }

  async listarAtivas(
    limite: number,
    pagina: number,
  ): Promise<{ total: number; vagas: Vaga[] }> {
    const cacheKey = `vagas:listar:pag:${pagina}:lim:${limite}`;
    const cached = this.cache.get<{ total: number; vagas: Vaga[] }>(cacheKey);
    if (cached) return cached;

    const skip = (pagina - 1) * limite;

    const [total, dbVagas] = await Promise.all([
      this.prisma.vaga.count({ where: { status: 'ativa' } }),
      this.prisma.vaga.findMany({
        where: { status: 'ativa' },
        skip,
        take: limite,
        orderBy: { dataCriacao: 'desc' },
      }),
    ]);

    const result = {
      total,
      vagas: dbVagas.map((v) => this.mapToDomain(v)!),
    };
    this.cache.set(cacheKey, result, 60); // 60 segundos
    return result;
  }

  async buscarPorPalavrasChave(
    palavrasChave: string[],
    limite: number,
    pagina: number,
  ): Promise<Vaga[]> {
    const skip = (pagina - 1) * limite;

    const dbVagas = await this.prisma.vaga.findMany({
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
  }

  async buscarPorRecrutador(
    recrutadorId: string,
    limite: number,
    pagina: number,
  ): Promise<{ total: number; vagas: Vaga[] }> {
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
          etapas: vaga.etapas || undefined,
          palavrasChave: vaga.palavrasChave,
          link: vaga.link,
        },
      });

      this.cache.deleteByPrefix('vagas:listar:');
      this.cache.delete(`vaga:detalhes:${id}`);

      return this.mapToDomain(dbVaga)!;
    });
  }

  async excluir(id: string): Promise<boolean> {
    return this.prisma.runWithRLS(async (tx) => {
      const result = await tx.vaga.delete({
        where: { id },
      });

      this.cache.deleteByPrefix('vagas:listar:');
      this.cache.delete(`vaga:detalhes:${id}`);

      return !!result;
    });
  }

  async expirarVagasAntigas(
    recrutadorId: string,
    dataLimite: Date,
  ): Promise<number> {
    return this.prisma.runWithRLS(async (tx) => {
      const result = await tx.vaga.updateMany({
        where: {
          recrutadorId,
          status: 'ativa',
          dataCriacao: {
            lt: dataLimite,
          },
        },
        data: {
          status: 'encerrada',
        },
      });

      if (result.count > 0) {
        this.cache.deleteByPrefix('vagas:listar:');
        this.logger.log(
          `Expiradas/encerradas ${result.count} vagas antigas para o recrutador ${recrutadorId}.`,
        );
      }

      return result.count;
    });
  }
}
